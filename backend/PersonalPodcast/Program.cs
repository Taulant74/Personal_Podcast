using DotNetEnv;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using Microsoft.EntityFrameworkCore;
using PersonalPodcast.Data;
using PersonalPodcast.Services;



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
                  .AllowAnyMethod();
        });
});



// Databaza
builder.Services.AddDbContext<PodcastDbContext>(options =>
                                               //ket connection stringin e ndrroni me ate qe e ke ti ne appsettings.json
    options.UseSqlServer(builder.Configuration.GetConnectionString("PersonalPodcastDatabase")));

// Controllerat
builder.Services.AddControllers();


builder.Services.AddScoped<CloudinaryService>();

builder.Services.Configure<IISServerOptions>(options =>
{
    options.MaxRequestBodySize = 50 * 1024 * 1024; // 50MB 
});

builder.Services.Configure<KestrelServerOptions>(options =>
{
    options.Limits.MaxRequestBodySize = 50 * 1024 * 1024; // 50MB
});


  
// Swaggeri
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

app.UseCors("AllowFrontend");


if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();
app.Run();
