using Microsoft.EntityFrameworkCore;
using PersonalPodcast.Data;

namespace PersonalPodcast.Tests;

public static class TestDbFactory
{
    public static PodcastDbContext Create(string dbName)
    {
        var options = new DbContextOptionsBuilder<PodcastDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .EnableSensitiveDataLogging()
            .Options;

        return new PodcastDbContext(options);
    }
}
