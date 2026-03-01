using Microsoft.AspNetCore.Mvc;
using PersonalPodcast.Data;
using PersonalPodcast.DTOs.Categories;
using PersonalPodcast.Models;

namespace PersonalPodcast.Tests;

public class CategoriesControllerTests
{
    private static CategoriesController CreateController(PodcastDbContext db) => new CategoriesController(db);

    private static void SeedCategories(PodcastDbContext db, params (int id, string name)[] cats)
    {
        foreach (var (id, name) in cats)
        {
            db.Categories.Add(new Category { Id = id, Name = name });
        }
        db.SaveChanges();
    }

    [Fact]
    public async Task GetAll_ReturnsEmptyList_WhenNoCategories()
    {
        using var db = TestDbFactory.Create(nameof(GetAll_ReturnsEmptyList_WhenNoCategories));
        var controller = CreateController(db);

        var result = await controller.GetAll();

        var list = Assert.IsType<List<CategoryDto>>(result.Value);
        Assert.Empty(list);
    }

    [Fact]
    public async Task GetAll_ReturnsCategories_OrderedByName()
    {
        using var db = TestDbFactory.Create(nameof(GetAll_ReturnsCategories_OrderedByName));
        SeedCategories(db,
            (1, "Zebra"),
            (2, "Alpha"),
            (3, "Music"));

        var controller = CreateController(db);

        var result = await controller.GetAll();

        var list = Assert.IsType<List<CategoryDto>>(result.Value);
        Assert.Equal(3, list.Count);
        Assert.Equal(new[] { "Alpha", "Music", "Zebra" }, list.Select(c => c.Name).ToArray());
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public async Task Create_WhenNameMissingOrWhitespace_ReturnsBadRequest(string? name)
    {
        using var db = TestDbFactory.Create(nameof(Create_WhenNameMissingOrWhitespace_ReturnsBadRequest));
        var controller = CreateController(db);

        var result = await controller.Create(new CreateCategoryDto { Name = name });

        var bad = Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.Equal(400, bad.StatusCode);
        Assert.Equal("Name is required.", bad.Value);
    }

    [Fact]
    public async Task Create_TrimsName_AndPersists_ReturnsOk()
    {
        using var db = TestDbFactory.Create(nameof(Create_TrimsName_AndPersists_ReturnsOk));
        var controller = CreateController(db);

        var result = await controller.Create(new CreateCategoryDto { Name = "   Technology   " });

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var dto = Assert.IsType<CategoryDto>(ok.Value);

        Assert.True(dto.Id > 0);
        Assert.Equal("Technology", dto.Name);

        var saved = db.Categories.Single(c => c.Id == dto.Id);
        Assert.Equal("Technology", saved.Name);
    }

    [Fact]
    public async Task Create_IsCaseInsensitiveConflict_ReturnsConflict()
    {
        using var db = TestDbFactory.Create(nameof(Create_IsCaseInsensitiveConflict_ReturnsConflict));
        SeedCategories(db, (1, "Technology"));

        var controller = CreateController(db);

        var result = await controller.Create(new CreateCategoryDto { Name = "technology" });

        var conflict = Assert.IsType<ConflictObjectResult>(result.Result);
        Assert.Equal(409, conflict.StatusCode);
        Assert.Equal("Category already exists.", conflict.Value);
    }

    [Fact]
    public async Task Delete_WhenCategoryNotFound_ReturnsNotFound()
    {
        using var db = TestDbFactory.Create(nameof(Delete_WhenCategoryNotFound_ReturnsNotFound));
        var controller = CreateController(db);

        var result = await controller.Delete(999);

        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task Delete_WhenCategoryUsedByEpisodes_ReturnsBadRequest()
    {
        using var db = TestDbFactory.Create(nameof(Delete_WhenCategoryUsedByEpisodes_ReturnsBadRequest));

        Seed.EpisodesForSearch(db);

        var controller = CreateController(db);

        var result = await controller.Delete(1);

        var bad = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Equal(400, bad.StatusCode);
        Assert.Equal("Cannot delete category that is used by episodes.", bad.Value);
    }

    [Fact]
    public async Task Delete_WhenCategoryNotUsed_DeletesAndReturnsNoContent()
    {
        using var db = TestDbFactory.Create(nameof(Delete_WhenCategoryNotUsed_DeletesAndReturnsNoContent));

        SeedCategories(db, (123, "Unused"));

        var controller = CreateController(db);

        var result = await controller.Delete(123);

        Assert.IsType<NoContentResult>(result);
        Assert.False(db.Categories.Any(c => c.Id == 123));
    }
}