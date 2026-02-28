using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PersonalPodcast.Controllers;
using PersonalPodcast.Data;
using PersonalPodcast.DTOs.Episodes;
using PersonalPodcast.Models;
using Xunit;

namespace PersonalPodcast.Tests;

public class PublisherControllerTests
{
    private static PublisherController CreateController(PodcastDbContext db, int? sid, string role)
    {
        var controller = new PublisherController(db, cloudinary: null!);

        var claims = new List<Claim>();
        if (sid != null)
            claims.Add(new Claim(ClaimTypes.Sid, sid.Value.ToString()));

        claims.Add(new Claim(ClaimTypes.Role, role));

        var identity = new ClaimsIdentity(claims, "TestAuth");
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(identity)
            }
        };

        return controller;
    }

    private static void SeedPublisherEpisodes(PodcastDbContext db)
    {
        db.Categories.AddRange(
            new Category { Id = 1, Name = "Tech" },
            new Category { Id = 2, Name = "Travel" }
        );

        db.Episodes.AddRange(
            new Episode
            {
                Id = 10,
                Title = "P1 Ep1",
                Description = "d",
                AudioUrl = "u",
                DurationSeconds = 10,
                Season = 1,
                IsPublished = true,
                PublishedDate = DateTime.UtcNow.AddDays(-2),
                IsPremium = false,
                PlayCount = 0,
                CreatedAt = DateTime.UtcNow.AddDays(-2),
                PublisherId = 1
            },
            new Episode
            {
                Id = 11,
                Title = "P1 Ep2",
                Description = "d",
                AudioUrl = "u",
                DurationSeconds = 10,
                Season = 1,
                IsPublished = false,
                PublishedDate = null,
                IsPremium = true,
                PlayCount = 0,
                CreatedAt = DateTime.UtcNow.AddDays(-1),
                PublisherId = 1
            },
            new Episode
            {
                Id = 20,
                Title = "P2 Ep1",
                Description = "d",
                AudioUrl = "u",
                DurationSeconds = 10,
                Season = 1,
                IsPublished = true,
                PublishedDate = DateTime.UtcNow.AddDays(-3),
                IsPremium = false,
                PlayCount = 0,
                CreatedAt = DateTime.UtcNow.AddDays(-3),
                PublisherId = 2
            }
        );

        db.EpisodeCategories.Add(new EpisodeCategory
        {
            EpisodeId = 10,
            CategoryId = 1
        });

        db.SaveChanges();
    }

    private static IFormFile MakeFakeFile(string name = "audio.mp3", int sizeBytes = 10)
    {
        var bytes = Encoding.UTF8.GetBytes(new string('a', Math.Max(sizeBytes, 1)));
        var stream = new MemoryStream(bytes);
        return new FormFile(stream, 0, bytes.Length, "file", name);
    }

    [Fact]
    public async Task MyEpisodes_WhenNoUserId_ReturnsUnauthorized()
    {
        using var db = TestDbFactory.Create(nameof(MyEpisodes_WhenNoUserId_ReturnsUnauthorized));
        SeedPublisherEpisodes(db);

        var controller = CreateController(db, sid: null, role: "Publisher");

        var result = await controller.MyEpisodes();

        Assert.IsType<UnauthorizedResult>(result);
    }

    [Fact]
    public async Task MyEpisodes_AsPublisher_ReturnsOnlyOwnEpisodes()
    {
        using var db = TestDbFactory.Create(nameof(MyEpisodes_AsPublisher_ReturnsOnlyOwnEpisodes));
        SeedPublisherEpisodes(db);

        var controller = CreateController(db, sid: 1, role: "Publisher");

        var result = await controller.MyEpisodes();

        var ok = Assert.IsType<OkObjectResult>(result);
        var items = Assert.IsAssignableFrom<IEnumerable<object>>(ok.Value);

        var list = items.Select(i => i.ToString() ?? "").ToList();
        Assert.Equal(2, list.Count);
        Assert.DoesNotContain(list, s => s.Contains("P2 Ep1"));
    }

    [Fact]
    public async Task MyEpisodes_AsAdmin_ReturnsAllEpisodes()
    {
        using var db = TestDbFactory.Create(nameof(MyEpisodes_AsAdmin_ReturnsAllEpisodes));
        SeedPublisherEpisodes(db);

        var controller = CreateController(db, sid: 999, role: "Admin");

        var result = await controller.MyEpisodes();

        var ok = Assert.IsType<OkObjectResult>(result);
        var items = Assert.IsAssignableFrom<IEnumerable<object>>(ok.Value);

        Assert.Equal(3, items.Count());
    }

    [Fact]
    public async Task Delete_WhenNoUserId_ReturnsUnauthorized()
    {
        using var db = TestDbFactory.Create(nameof(Delete_WhenNoUserId_ReturnsUnauthorized));
        SeedPublisherEpisodes(db);

        var controller = CreateController(db, sid: null, role: "Publisher");

        var result = await controller.Delete(10);

        Assert.IsType<UnauthorizedResult>(result);
    }

    [Fact]
    public async Task Delete_WhenEpisodeNotFound_ReturnsNotFoundWithMessage()
    {
        using var db = TestDbFactory.Create(nameof(Delete_WhenEpisodeNotFound_ReturnsNotFoundWithMessage));
        SeedPublisherEpisodes(db);

        var controller = CreateController(db, sid: 1, role: "Publisher");

        var result = await controller.Delete(999);

        var nf = Assert.IsType<NotFoundObjectResult>(result);
        Assert.Equal("Episode not found.", nf.Value);
    }

    [Fact]
    public async Task Delete_WhenNotOwnerAndNotAdmin_ReturnsForbid()
    {
        using var db = TestDbFactory.Create(nameof(Delete_WhenNotOwnerAndNotAdmin_ReturnsForbid));
        SeedPublisherEpisodes(db);

        var controller = CreateController(db, sid: 1, role: "Publisher");

        var result = await controller.Delete(20);

        Assert.IsType<ForbidResult>(result);
    }

    [Fact]
    public async Task Delete_WhenOwner_DeletesEpisodeAndLinks_ReturnsNoContent()
    {
        using var db = TestDbFactory.Create(nameof(Delete_WhenOwner_DeletesEpisodeAndLinks_ReturnsNoContent));
        SeedPublisherEpisodes(db);

        var controller = CreateController(db, sid: 1, role: "Publisher");

        Assert.True(db.Episodes.Any(e => e.Id == 10));
        Assert.True(db.EpisodeCategories.Any(ec => ec.EpisodeId == 10));

        var result = await controller.Delete(10);

        Assert.IsType<NoContentResult>(result);
        Assert.False(db.Episodes.Any(e => e.Id == 10));
        Assert.False(db.EpisodeCategories.Any(ec => ec.EpisodeId == 10));
    }

    [Fact]
    public async Task Update_WhenNoUserId_ReturnsUnauthorized()
    {
        using var db = TestDbFactory.Create(nameof(Update_WhenNoUserId_ReturnsUnauthorized));
        SeedPublisherEpisodes(db);

        var controller = CreateController(db, sid: null, role: "Publisher");

        var req = new UpdateEpisodeRequest { title = "New" };
        var result = await controller.Update(10, req);

        Assert.IsType<UnauthorizedResult>(result);
    }

    [Fact]
    public async Task Update_WhenEpisodeNotFound_ReturnsNotFoundWithMessage()
    {
        using var db = TestDbFactory.Create(nameof(Update_WhenEpisodeNotFound_ReturnsNotFoundWithMessage));
        SeedPublisherEpisodes(db);

        var controller = CreateController(db, sid: 1, role: "Publisher");

        var req = new UpdateEpisodeRequest { title = "New" };
        var result = await controller.Update(999, req);

        var nf = Assert.IsType<NotFoundObjectResult>(result);
        Assert.Equal("Episode not found.", nf.Value);
    }

    [Fact]
    public async Task Update_WhenNotOwnerAndNotAdmin_ReturnsForbid()
    {
        using var db = TestDbFactory.Create(nameof(Update_WhenNotOwnerAndNotAdmin_ReturnsForbid));
        SeedPublisherEpisodes(db);

        var controller = CreateController(db, sid: 1, role: "Publisher");

        var req = new UpdateEpisodeRequest { title = "New" };
        var result = await controller.Update(20, req);

        Assert.IsType<ForbidResult>(result);
    }

    [Fact]
    public async Task Update_WhenTitleMissing_ReturnsBadRequest()
    {
        using var db = TestDbFactory.Create(nameof(Update_WhenTitleMissing_ReturnsBadRequest));
        SeedPublisherEpisodes(db);

        var controller = CreateController(db, sid: 1, role: "Publisher");

        var req = new UpdateEpisodeRequest { title = "   " };
        var result = await controller.Update(10, req);

        var bad = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Equal("Title is required.", bad.Value);
    }

    [Fact]
    public async Task Update_WhenUnpublishing_SetsPublishedFalse_AndClearsPublishedDate()
    {
        using var db = TestDbFactory.Create(nameof(Update_WhenUnpublishing_SetsPublishedFalse_AndClearsPublishedDate));
        SeedPublisherEpisodes(db);

        var controller = CreateController(db, sid: 1, role: "Publisher");

        var before = await db.Episodes.SingleAsync(e => e.Id == 10);
        Assert.True(before.IsPublished);
        Assert.NotNull(before.PublishedDate);

        var req = new UpdateEpisodeRequest
        {
            title = "P1 Ep1 Updated",
            isPublished = false
        };

        var result = await controller.Update(10, req);

        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.NotNull(ok.Value);

        var after = await db.Episodes.SingleAsync(e => e.Id == 10);
        Assert.False(after.IsPublished);
        Assert.Null(after.PublishedDate);
        Assert.Equal("P1 Ep1 Updated", after.Title);
    }

    [Fact]
    public async Task Update_WhenPublishingFromUnpublished_SetsPublishedTrue_AndSetsPublishedDate()
    {
        using var db = TestDbFactory.Create(nameof(Update_WhenPublishingFromUnpublished_SetsPublishedTrue_AndSetsPublishedDate));
        SeedPublisherEpisodes(db);

        var controller = CreateController(db, sid: 1, role: "Publisher");

        var before = await db.Episodes.SingleAsync(e => e.Id == 11);
        Assert.False(before.IsPublished);
        Assert.Null(before.PublishedDate);

        var req = new UpdateEpisodeRequest
        {
            title = "P1 Ep2 Updated",
            isPublished = true
        };

        var result = await controller.Update(11, req);

        Assert.IsType<OkObjectResult>(result);

        var after = await db.Episodes.SingleAsync(e => e.Id == 11);
        Assert.True(after.IsPublished);
        Assert.NotNull(after.PublishedDate);
        Assert.Equal("P1 Ep2 Updated", after.Title);
    }

    [Fact]
    public async Task Update_WhenCategoryIdsContainMissing_ReturnsBadRequest()
    {
        using var db = TestDbFactory.Create(nameof(Update_WhenCategoryIdsContainMissing_ReturnsBadRequest));
        SeedPublisherEpisodes(db);

        var controller = CreateController(db, sid: 1, role: "Publisher");

        var req = new UpdateEpisodeRequest
        {
            title = "New Title",
            isPublished = true,
            categoryIds = "1, 999"
        };

        var result = await controller.Update(10, req);

        var bad = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Contains("Invalid category id(s):", bad.Value?.ToString());
        Assert.Contains("999", bad.Value?.ToString());
    }

    [Fact]
    public async Task Upload_WhenTitleMissing_ReturnsBadRequest()
    {
        using var db = TestDbFactory.Create(nameof(Upload_WhenTitleMissing_ReturnsBadRequest));
        SeedPublisherEpisodes(db);

        var controller = CreateController(db, sid: 1, role: "Publisher");

        var req = new UploadEpisodeRequest
        {
            title = "  ",
            file = MakeFakeFile()
        };

        var result = await controller.Upload(req);

        var bad = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Equal("Title is required.", bad.Value);
    }

    [Fact]
    public async Task Upload_WhenFileMissing_ReturnsBadRequest()
    {
        using var db = TestDbFactory.Create(nameof(Upload_WhenFileMissing_ReturnsBadRequest));
        SeedPublisherEpisodes(db);

        var controller = CreateController(db, sid: 1, role: "Publisher");

        var req = new UploadEpisodeRequest
        {
            title = "Valid title",
            file = null
        };

        var result = await controller.Upload(req);

        var bad = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Equal("Audio file is required.", bad.Value);
    }

    [Fact]
    public async Task Upload_WhenNoUserId_ReturnsUnauthorized()
    {
        using var db = TestDbFactory.Create(nameof(Upload_WhenNoUserId_ReturnsUnauthorized));
        SeedPublisherEpisodes(db);

        var controller = CreateController(db, sid: null, role: "Publisher");

        var req = new UploadEpisodeRequest
        {
            title = "Valid title",
            file = MakeFakeFile()
        };

        var result = await controller.Upload(req);

        Assert.IsType<UnauthorizedResult>(result);
    }

    [Fact]
    public async Task Upload_WhenCategoryIdsContainMissing_ReturnsBadRequest_BeforeCloudinaryCall()
    {
        using var db = TestDbFactory.Create(nameof(Upload_WhenCategoryIdsContainMissing_ReturnsBadRequest_BeforeCloudinaryCall));
        SeedPublisherEpisodes(db);

        var controller = CreateController(db, sid: 1, role: "Publisher");

        var req = new UploadEpisodeRequest
        {
            title = "Valid title",
            file = MakeFakeFile(),
            categoryIds = "1, 999"
        };

        var result = await controller.Upload(req);

        var bad = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Contains("Invalid category id(s):", bad.Value?.ToString());
        Assert.Contains("999", bad.Value?.ToString());
    }
}