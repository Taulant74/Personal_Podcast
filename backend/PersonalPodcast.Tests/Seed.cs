using PersonalPodcast.Data;
using PersonalPodcast.Models;

namespace PersonalPodcast.Tests;

public static class Seed
{
    public static void EpisodesForSearch(PodcastDbContext db)
    {
        var tech = new Category { Id = 1, Name = "Technology" };
        var travel = new Category { Id = 2, Name = "Travel" };
        db.Categories.AddRange(tech, travel);

        var e1 = new Episode
        {
            Id = 1,
            Title = "AI for Beginners: Prompting 101",
            Description = "Intro to prompting",
            AudioUrl = "https://example.com/a.mp3",
            DurationSeconds = 1000,
            IsPublished = true,
            PublishedDate = new DateTime(2026, 2, 1),
            PlayCount = 120,
            CreatedAt = new DateTime(2026, 1, 20)
        };

        var e2 = new Episode
        {
            Id = 2,
            Title = "Travel Diaries: Istanbul Street Food Tour",
            Description = "Street food in Istanbul",
            AudioUrl = "https://example.com/t.mp3",
            DurationSeconds = 1200,
            IsPublished = true,
            PublishedDate = new DateTime(2026, 2, 18),
            PlayCount = 52,
            CreatedAt = new DateTime(2026, 2, 10)
        };

        var e3 = new Episode
        {
            Id = 3,
            Title = "Unreleased Episode",
            Description = "Not published",
            AudioUrl = "https://example.com/u.mp3",
            DurationSeconds = 800,
            IsPublished = false,
            PublishedDate = null,
            PlayCount = 0,
            CreatedAt = new DateTime(2026, 2, 5)
        };

        db.Episodes.AddRange(e1, e2, e3);

        db.EpisodeCategories.AddRange(
            new EpisodeCategory { EpisodeId = 1, CategoryId = 1, Category = tech },
            new EpisodeCategory { EpisodeId = 2, CategoryId = 2, Category = travel }
        );

        db.SaveChanges();
    }
}
