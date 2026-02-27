using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PersonalPodcast.Controllers;
using PersonalPodcast.DTOs.Orders;
using PersonalPodcast.Models;
using Xunit;

namespace PersonalPodcast.Tests;

public class OrdersControllerCreateTests
{
    private static OrdersController CreateControllerWithSidClaim(PersonalPodcast.Data.PodcastDbContext db, string? sidClaimValue)
    {
        var controller = new OrdersController(db);

        var claims = new System.Collections.Generic.List<Claim>();
        if (sidClaimValue != null)
            claims.Add(new Claim(ClaimTypes.Sid, sidClaimValue));

        var identity = new ClaimsIdentity(claims, authenticationType: "TestAuth");
        var principal = new ClaimsPrincipal(identity);

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };

        return controller;
    }

    private static void SeedPublishedEpisode(PersonalPodcast.Data.PodcastDbContext db, int episodeId = 10, bool isPublished = true)
    {
        db.Episodes.Add(new Episode
        {
            Id = episodeId,
            Title = "Test Episode",
            Description = "desc",
            AudioUrl = "https://example.com/test.mp3",
            DurationSeconds = 100,
            IsPublished = isPublished,
            IsPremium = false,
            PublishedDate = isPublished ? DateTime.UtcNow : null,
            PlayCount = 0,
            CreatedAt = DateTime.UtcNow
        });
        db.SaveChanges();
    }

    [Fact]
    public async Task Create_EpisodeIdLessOrEqualZero_ReturnsBadRequest()
    {
        using var db = TestDbFactory.Create(nameof(Create_EpisodeIdLessOrEqualZero_ReturnsBadRequest));
        var controller = CreateControllerWithSidClaim(db, "1");

        var result = await controller.Create(new CreateOrderRequestDto { EpisodeId = 0 });

        var bad = Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.Equal(400, bad.StatusCode);
    }

    [Fact]
    public async Task Create_MissingSidClaim_ReturnsUnauthorized()
    {
        using var db = TestDbFactory.Create(nameof(Create_MissingSidClaim_ReturnsUnauthorized));
        SeedPublishedEpisode(db, episodeId: 10, isPublished: true);

        var controller = CreateControllerWithSidClaim(db, sidClaimValue: null);

        var result = await controller.Create(new CreateOrderRequestDto { EpisodeId = 10 });

        var unauth = Assert.IsType<UnauthorizedObjectResult>(result.Result);
        Assert.Equal(401, unauth.StatusCode);
    }

    [Fact]
    public async Task Create_NonIntSidClaim_ReturnsUnauthorized()
    {
        using var db = TestDbFactory.Create(nameof(Create_NonIntSidClaim_ReturnsUnauthorized));
        SeedPublishedEpisode(db, episodeId: 10, isPublished: true);

        var controller = CreateControllerWithSidClaim(db, sidClaimValue: "abc");

        var result = await controller.Create(new CreateOrderRequestDto { EpisodeId = 10 });

        var unauth = Assert.IsType<UnauthorizedObjectResult>(result.Result);
        Assert.Equal(401, unauth.StatusCode);
    }

    [Fact]
    public async Task Create_EpisodeNotPublishedOrNotFound_ReturnsNotFound()
    {
        using var db = TestDbFactory.Create(nameof(Create_EpisodeNotPublishedOrNotFound_ReturnsNotFound));

        // Seed an episode but NOT published
        SeedPublishedEpisode(db, episodeId: 10, isPublished: false);

        var controller = CreateControllerWithSidClaim(db, "1");

        var result = await controller.Create(new CreateOrderRequestDto { EpisodeId = 10 });

        var notFound = Assert.IsType<NotFoundObjectResult>(result.Result);
        Assert.Equal(404, notFound.StatusCode);
    }

    [Fact]
    public async Task Create_WhenAlreadyOrdered_ReturnsConflict()
    {
        using var db = TestDbFactory.Create(nameof(Create_WhenAlreadyOrdered_ReturnsConflict));
        SeedPublishedEpisode(db, episodeId: 10, isPublished: true);

        db.Orders.Add(new Order
        {
            UserId = 1,
            EpisodeId = 10,
            CreatedAt = DateTime.UtcNow
        });
        db.SaveChanges();

        var controller = CreateControllerWithSidClaim(db, "1");

        var result = await controller.Create(new CreateOrderRequestDto { EpisodeId = 10 });

        var conflict = Assert.IsType<ConflictObjectResult>(result.Result);
        Assert.Equal(409, conflict.StatusCode);
    }

    [Fact]
    public async Task Create_ValidRequest_CreatesOrder_ReturnsOk_AndPersists()
    {
        using var db = TestDbFactory.Create(nameof(Create_ValidRequest_CreatesOrder_ReturnsOk_AndPersists));
        SeedPublishedEpisode(db, episodeId: 10, isPublished: true);

        var controller = CreateControllerWithSidClaim(db, "1");

        var result = await controller.Create(new CreateOrderRequestDto { EpisodeId = 10 });

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var dto = Assert.IsType<CreateOrderResponseDto>(ok.Value);

        Assert.True(dto.Id > 0);
        Assert.Equal(10, dto.EpisodeId);

        var saved = db.Orders.Single(o => o.Id == dto.Id);
        Assert.Equal(1, saved.UserId);
        Assert.Equal(10, saved.EpisodeId);
    }
}