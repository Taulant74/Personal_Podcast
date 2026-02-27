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

        var request = new EpisodeSearchRequestDto { Title = "Prompting" };
        var result = await controller.Search(request);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var body = Assert.IsType<PagedResultDto<EpisodeSearchItemDto>>(ok.Value);

        Assert.Single(body.Items);
        Assert.Contains("Prompting", body.Items[0].Title);
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

    [Fact]
    public async Task Search_ByCategoryId_FindsEpisode()
    {
        using var db = TestDbFactory.Create(nameof(Search_ByCategoryId_FindsEpisode));
        Seed.EpisodesForSearch(db);

        var controller = new EpisodesController(db);

        var request = new EpisodeSearchRequestDto { CategoryId = 1 };
        var result = await controller.Search(request);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var body = Assert.IsType<PagedResultDto<EpisodeSearchItemDto>>(ok.Value);

        Assert.Single(body.Items);
        Assert.Contains("Technology", body.Items[0].Categories);
    }

    [Fact]
    public async Task Search_PremiumEpisode_MasksAudioUrl()
    {
        using var db = TestDbFactory.Create(nameof(Search_PremiumEpisode_MasksAudioUrl));
        Seed.EpisodesForSearch(db);

        var controller = new EpisodesController(db);

        var request = new EpisodeSearchRequestDto { Q = "Istanbul" };
        var result = await controller.Search(request);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var body = Assert.IsType<PagedResultDto<EpisodeSearchItemDto>>(ok.Value);

        Assert.Single(body.Items);
        Assert.True(body.Items[0].IsPremium);
        Assert.Equal("", body.Items[0].AudioUrl);
    }

    [Fact]
    public async Task Search_Page_And_PageSize_AreNormalized_WhenInvalid()
    {
        using var db = TestDbFactory.Create(nameof(Search_Page_And_PageSize_AreNormalized_WhenInvalid));
        Seed.EpisodesForSearch(db);

        var controller = new EpisodesController(db);

        var request = new EpisodeSearchRequestDto { Page = 0, PageSize = 0 };
        var result = await controller.Search(request);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var body = Assert.IsType<PagedResultDto<EpisodeSearchItemDto>>(ok.Value);

        Assert.Equal(1, body.Page);
        Assert.Equal(10, body.PageSize);
    }

    [Fact]
    public async Task Search_SortByPlayCount_Asc_Works()
    {
        using var db = TestDbFactory.Create(nameof(Search_SortByPlayCount_Asc_Works));
        Seed.EpisodesForSearch(db);

        var controller = new EpisodesController(db);

        var request = new EpisodeSearchRequestDto { SortBy = "playCount", SortDir = "asc" };
        var result = await controller.Search(request);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var body = Assert.IsType<PagedResultDto<EpisodeSearchItemDto>>(ok.Value);

        Assert.Equal(2, body.Items.Count);
        Assert.True(body.Items[0].PlayCount <= body.Items[1].PlayCount);
    }

    [Fact]
    public async Task Search_Q_ByPublisherUsername_FindsEpisode()
    {
        using var db = TestDbFactory.Create(nameof(Search_Q_ByPublisherUsername_FindsEpisode));
        Seed.EpisodesForSearch(db);

        var controller = new EpisodesController(db);

        var request = new EpisodeSearchRequestDto { Q = "johnny" };
        var result = await controller.Search(request);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var body = Assert.IsType<PagedResultDto<EpisodeSearchItemDto>>(ok.Value);

        Assert.Single(body.Items);
        Assert.Contains("Prompting", body.Items[0].Title);
    }
}
