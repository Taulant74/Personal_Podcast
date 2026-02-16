using DotNetEnv;
using Microsoft.EntityFrameworkCore;
using PersonalPodcast.Data;
using PersonalPodcast.Services;



// e loadim .env file ku e kena rujt konfigurimin e cloudinary
Env.Load();

Console.WriteLine("Cloudinary name = " + Environment.GetEnvironmentVariable("CLOUDINARY_CLOUD_NAME"));


var builder = WebApplication.CreateBuilder(args);

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
app.UseAuthorization();
app.MapControllers();
app.Run();
