using Microsoft.AspNetCore.Mvc;
using PersonalPodcast.Data;
using PersonalPodcast.Models;
using PersonalPodcast.DTOs.Categories;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Route("api/categories")]
public class CategoriesController : ControllerBase
{
    private readonly PodcastDbContext _db;
    public CategoriesController(PodcastDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<List<CategoryDto>>> GetAll()
        => await _db.Categories
            .AsNoTracking()
            .OrderBy(c => c.Name)
            .Select(c => new CategoryDto { Id = c.Id, Name = c.Name })
            .ToListAsync();

    [HttpPost]
    public async Task<ActionResult<CategoryDto>> Create([FromBody] CreateCategoryDto dto)
    {
        var name = (dto.Name ?? "").Trim();
        if (name.Length == 0) return BadRequest("Name is required.");


        var exists = await _db.Categories.AnyAsync(c => c.Name.ToLower() == name.ToLower());
        if (exists) return Conflict("Category already exists.");

        var cat = new Category { Name = name };
        _db.Categories.Add(cat);
        await _db.SaveChangesAsync();

        return Ok(new CategoryDto { Id = cat.Id, Name = cat.Name });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var cat = await _db.Categories
            .Include(c => c.EpisodeCategories)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (cat == null) return NotFound();

        if (cat.EpisodeCategories.Any())
            return BadRequest("Cannot delete category that is used by episodes.");

        _db.Categories.Remove(cat);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}