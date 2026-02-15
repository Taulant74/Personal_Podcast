using Microsoft.EntityFrameworkCore;
using PersonalPodcast.Data;

var builder = WebApplication.CreateBuilder(args);

// Databaza
builder.Services.AddDbContext<PodcastDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

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
