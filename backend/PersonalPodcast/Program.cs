using CloudinaryDotNet;
using DotNetEnv;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using PersonalPodcast.Data;
using PersonalPodcast.Services;
using System.Text;

// e loadim .env file ku e kena rujt konfigurimin e cloudinary
Env.Load();

Console.WriteLine("Cloudinary name = " + Environment.GetEnvironmentVariable("CLOUDINARY_CLOUD_NAME"));


var builder = WebApplication.CreateBuilder(args);


// CORS policy per me lan backendin me komuniku me frontin 
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy =>
        {
            policy.WithOrigins("http://localhost:3000") // e boni me origjinen e frontit t juve deri te hostojna frontin
                  .AllowAnyHeader()
                  .AllowAnyMethod() // nese do te dergojme cookies nga fronti, e boni me kete rresht
                  .AllowCredentials(); 
        });
});



//----------------------------------------------//
// Vendosni sherbimet tjera posht qetij komenti,
// Mos e kaloni builder.build()
//----------------------------------------------//

//Jwt
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.MapInboundClaims = false;

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ClockSkew = TimeSpan.Zero,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
        };
    });

// Cloudinary
builder.Services.AddSingleton(sp =>
{
    var cloudName = Environment.GetEnvironmentVariable("CLOUDINARY_CLOUD_NAME");
    var apiKey = Environment.GetEnvironmentVariable("CLOUDINARY_API_KEY");
    var apiSecret = Environment.GetEnvironmentVariable("CLOUDINARY_API_SECRET");

    if (string.IsNullOrWhiteSpace(cloudName) ||
        string.IsNullOrWhiteSpace(apiKey) ||
        string.IsNullOrWhiteSpace(apiSecret))
    {
        throw new Exception("Cloudinary env vars missing. Check CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET");
    }

    var cloudinary = new Cloudinary(new Account(cloudName, apiKey, apiSecret));

    cloudinary.Api.Timeout = 10 * 60 * 1000; // 10 minutes

    return cloudinary;
});

builder.Services.AddScoped<CloudinaryService>();


// Databaza
var cs = Environment.GetEnvironmentVariable("DB_CONNECTION");

if (string.IsNullOrWhiteSpace(cs))
    throw new Exception("DB_CONNECTION is missing. Put it in .env or environment variables.");

builder.Services.AddDbContext<PodcastDbContext>(options =>
    options.UseSqlServer(cs));

// Controllerat
builder.Services.AddControllers();

builder.Services.AddScoped<UserCreateService>();


builder.Services.Configure<IISServerOptions>(options =>
{
    options.MaxRequestBodySize = 50 * 1024 * 1024; // 50MB 
});

builder.Services.Configure<KestrelServerOptions>(options =>
{
    options.Limits.MaxRequestBodySize = 50 * 1024 * 1024; // 50MB
});

//user service per me kriju usera prej admindashboardit
builder.Services.AddScoped<UserService>();


// Swaggeri
builder.Services.AddHealthChecks();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.CustomSchemaIds(t => t.FullName); 
});

builder.Services.AddScoped<PersonalPodcast.Services.IValidationService, PersonalPodcast.Services.ValidationService>();
builder.Services.AddScoped<PersonalPodcast.Services.IAuthService, PersonalPodcast.Services.AuthService>();
builder.Services.AddScoped<PersonalPodcast.Services.IUserService, PersonalPodcast.Services.UserService>();

var app = builder.Build();

app.MapHealthChecks("/health");

app.UseCors("AllowFrontend");

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

if (!app.Environment.IsProduction())
{
    app.UseHttpsRedirection();
}

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<PodcastDbContext>();
    //db.Database.Migrate();
}

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.Run();
