using DotNetEnv;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using PersonalPodcast.Data;
using PersonalPodcast.Services;
using System.Text;

// e loadim .env file ku e kena rujt konfigurimin e cloudinary
Env.Load();

Console.WriteLine("Cloudinary name = " + Environment.GetEnvironmentVariable("CLOUDINARY_CLOUD_NAME"));


var builder = WebApplication.CreateBuilder(args);

//----------------------------------------------//
// Vendosni sherbimet tjera posht qetij komenti,
// Mos e kaloni builder.build()
//----------------------------------------------//

//Jwt
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(options =>
{

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

//cloudinary
builder.Services.AddScoped<CloudinaryService>();

// Databaza
builder.Services.AddDbContext<PodcastDbContext>(options =>
                                               //ket connection stringin e ndrroni me ate qe e ke ti ne appsettings.json
    options.UseSqlServer(builder.Configuration.GetConnectionString("PersonalPodcastDatabase")));

// Controllerat
builder.Services.AddControllers();

// Swaggeri
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.Run();
