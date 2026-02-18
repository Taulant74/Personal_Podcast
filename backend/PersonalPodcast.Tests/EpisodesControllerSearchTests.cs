using Microsoft.AspNetCore.Mvc;
using PersonalPodcast.Controllers;
using PersonalPodcast.DTOs.Common;
using PersonalPodcast.DTOs.Episodes;
using Xunit;

namespace PersonalPodcast.Tests;

public class EpisodesControllerSearchTests
{
    [Fact]
    public async Task Search_WithNullRequest_ReturnsOnlyPublished()
    {
        using var db = TestDbFactory.Create(nameof(Search_WithNullRequest_ReturnsOnlyPublished));
        Seed.EpisodesForSearch(db);

        var controller = new EpisodesController(db);

        var result = await controller.Search(null);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var body = Assert.IsType<PagedResultDto<EpisodeSearchItemDto>>(ok.Value);

        Assert.Equal(1, body.Page);
        Assert.Equal(20, body.PageSize);
        Assert.Equal(2, body.Total);
        Assert.All(body.Items, i => Assert.NotNull(i.PublishedDate));
    }

    [Fact]
    public async Task Search_ByTitle_FindsEpisode()
    {
        using var db = TestDbFactory.Create(nameof(Search_ByTitle_FindsEpisode));
        Seed.EpisodesForSearch(db);

        var controller = new EpisodesController(db);

        var request = new EpisodeSearchRequestDto { Q = "Prompting" };
        var result = await controller.Search(request);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var body = Assert.IsType<PagedResultDto<EpisodeSearchItemDto>>(ok.Value);

        Assert.Single(body.Items);
        Assert.Contains("Prompting", body.Items[0].Title);
    }

    [Fact]
    public async Task Search_ByDescription_FindsEpisode()
    {
        using var db = TestDbFactory.Create(nameof(Search_ByDescription_FindsEpisode));
        Seed.EpisodesForSearch(db);

        var controller = new EpisodesController(db);

        var request = new EpisodeSearchRequestDto { Q = "Istanbul" };
        var result = await controller.Search(request);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var body = Assert.IsType<PagedResultDto<EpisodeSearchItemDto>>(ok.Value);

        Assert.Single(body.Items);
        Assert.Contains("Istanbul", body.Items[0].Title);
    }

    [Fact]
    public async Task Search_ByCategoryName_FindsEpisode()
    {
        using var db = TestDbFactory.Create(nameof(Search_ByCategoryName_FindsEpisode));
        Seed.EpisodesForSearch(db);

        var controller = new EpisodesController(db);

        var request = new EpisodeSearchRequestDto { Q = "Technology" };
        var result = await controller.Search(request);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var body = Assert.IsType<PagedResultDto<EpisodeSearchItemDto>>(ok.Value);

        Assert.Single(body.Items);
        Assert.Contains("Technology", body.Items[0].Categories);
    }

    [Fact]
    public async Task Search_PageSize_IsClampedTo50()
    {
        using var db = TestDbFactory.Create(nameof(Search_PageSize_IsClampedTo50));
        Seed.EpisodesForSearch(db);

        var controller = new EpisodesController(db);

        var request = new EpisodeSearchRequestDto { PageSize = 500 };
        var result = await controller.Search(request);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var body = Assert.IsType<PagedResultDto<EpisodeSearchItemDto>>(ok.Value);

        Assert.Equal(50, body.PageSize);
    }
}
