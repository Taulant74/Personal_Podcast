using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PersonalPodcast.Data;
using PersonalPodcast.Models;
using PersonalPodcast.Services;
using System.Security.Claims;

namespace PersonalPodcast.Controllers;

[ApiController]
[Route("api/publisher")]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Publisher,Admin")]
public class PublisherController : ControllerBase
{
    private readonly PodcastDbContext _db;
    private readonly CloudinaryService _cloudinary;

    public PublisherController(PodcastDbContext db, CloudinaryService cloudinary)
    {
        _db = db;
        _cloudinary = cloudinary;
    }

    private int? GetUserId()
    {
        var idStr = User.FindFirstValue(ClaimTypes.Sid)
                  ?? User.FindFirstValue("sid")
                  ?? User.FindFirstValue(ClaimTypes.NameIdentifier)
                  ?? User.FindFirstValue("sub");
        return int.TryParse(idStr, out var id) ? id : null;
    }

    private bool IsAdmin() => User.IsInRole("Admin");

    private static List<int> ParseCategoryIds(string? csv)
    {
        if (string.IsNullOrWhiteSpace(csv)) return new();
        return csv.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(s => int.TryParse(s, out var id) ? id : (int?)null)
            .Where(id => id.HasValue && id.Value > 0)
            .Select(id => id!.Value)
            .Distinct()
            .ToList();
    }

    private async Task ValidateCategoryIdsOrThrow(List<int> ids)
    {
        if (ids.Count == 0) return;

        var existing = await _db.Categories
            .Where(c => ids.Contains(c.Id))
            .Select(c => c.Id)
            .ToListAsync();

        var missing = ids.Except(existing).ToList();
        if (missing.Count > 0)
            throw new ArgumentException($"Invalid category id(s): {string.Join(", ", missing)}");
    }

    [HttpGet("episodes")]
    public async Task<IActionResult> MyEpisodes()
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var q = _db.Episodes.AsNoTracking();

        if (!IsAdmin())
            q = q.Where(e => e.PublisherId == userId);

        var items = await q
            .Include(e => e.EpisodeCategories)
                .ThenInclude(ec => ec.Category)
            .OrderByDescending(e => e.CreatedAt)
            .Select(e => new
            {
                id = e.Id,
                title = e.Title,
                description = e.Description,
                audioUrl = e.AudioUrl,
                durationSeconds = e.DurationSeconds,
                season = e.Season,
                isPublished = e.IsPublished,
                publishedDate = e.PublishedDate,
                playCount = e.PlayCount,
                createdAt = e.CreatedAt,
                publisherId = e.PublisherId,

                // ✅ for table
                categories = e.EpisodeCategories
                    .Where(ec => ec.Category != null)
                    .Select(ec => ec.Category!.Name)
                    .Distinct()
                    .ToList(),

                // ✅ for edit checkbox preload
                categoryIds = e.EpisodeCategories
                    .Select(ec => ec.CategoryId)
                    .Distinct()
                    .ToList()
            })
            .ToListAsync();

        return Ok(items);
    }

    [HttpPost("episodes")]
    public async Task<IActionResult> Upload(
        [FromForm] string title,
        [FromForm] string? description,
        [FromForm] string? categoryIds,
        [FromForm] int? season,
        [FromForm] bool isPublished,
        [FromForm] IFormFile file)
    {
        if (string.IsNullOrWhiteSpace(title)) return BadRequest("Title is required.");
        if (file == null || file.Length == 0) return BadRequest("Audio file is required.");

        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var ids = ParseCategoryIds(categoryIds);
        try { await ValidateCategoryIdsOrThrow(ids); }
        catch (ArgumentException ex) { return BadRequest(ex.Message); }

        var (audioUrl, durationSeconds) = await _cloudinary.UploadAudioAsync(file);

        var episode = new Episode
        {
            Title = title.Trim(),
            Description = description,
            AudioUrl = audioUrl,
            DurationSeconds = Math.Max(durationSeconds, 1),
            Season = season,
            IsPublished = isPublished,
            PublishedDate = isPublished ? DateTime.UtcNow : null,
            PlayCount = 0,
            CreatedAt = DateTime.UtcNow,
            PublisherId = userId
        };

        _db.Episodes.Add(episode);
        await _db.SaveChangesAsync();

        if (ids.Count > 0)
        {
            foreach (var cid in ids)
            {
                _db.Set<EpisodeCategory>().Add(new EpisodeCategory
                {
                    EpisodeId = episode.Id,
                    CategoryId = cid
                });
            }
            await _db.SaveChangesAsync();
        }

        return Ok(new { episode.Id });
    }
    [HttpDelete("episodes/{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var episode = await _db.Episodes
            .Include(e => e.EpisodeCategories) // remove if you don't have categories relation
            .FirstOrDefaultAsync(e => e.Id == id);

        if (episode == null) return NotFound("Episode not found.");

        // ownership check (publishers only)
        if (!IsAdmin() && episode.PublisherId != userId)
            return Forbid();

        // if you have join table and cascade isn't configured
        if (episode.EpisodeCategories != null && episode.EpisodeCategories.Count > 0)
            _db.Set<EpisodeCategory>().RemoveRange(episode.EpisodeCategories);

        _db.Episodes.Remove(episode);
        await _db.SaveChangesAsync();

        return NoContent(); // 204
    }
    [HttpPut("episodes/{id:int}")]
    public async Task<IActionResult> Update(
        int id,
        [FromForm] string title,
        [FromForm] string? description,
        [FromForm] string? categoryIds,
        [FromForm] int? season,
        [FromForm] bool isPublished,
        [FromForm] IFormFile? file)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var episode = await _db.Episodes
            .Include(e => e.EpisodeCategories)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (episode == null) return NotFound("Episode not found.");

        if (!IsAdmin() && episode.PublisherId != userId)
            return Forbid();

        if (string.IsNullOrWhiteSpace(title)) return BadRequest("Title is required.");

        episode.Title = title.Trim();
        episode.Description = description;
        episode.Season = season;

        if (!isPublished)
        {
            episode.IsPublished = false;
            episode.PublishedDate = null;
        }
        else
        {
            if (!episode.IsPublished) episode.PublishedDate = DateTime.UtcNow;
            episode.IsPublished = true;
        }

        if (file != null && file.Length > 0)
        {
            var (newUrl, newDur) = await _cloudinary.UploadAudioAsync(file);
            episode.AudioUrl = newUrl;
            episode.DurationSeconds = Math.Max(newDur, 1);
        }

        if (categoryIds != null)
        {
            var ids = ParseCategoryIds(categoryIds);
            try { await ValidateCategoryIdsOrThrow(ids); }
            catch (ArgumentException ex) { return BadRequest(ex.Message); }

            if (episode.EpisodeCategories != null && episode.EpisodeCategories.Count > 0)
                _db.Set<EpisodeCategory>().RemoveRange(episode.EpisodeCategories);

            if (ids.Count > 0)
            {
                foreach (var cid in ids)
                {
                    _db.Set<EpisodeCategory>().Add(new EpisodeCategory
                    {
                        EpisodeId = episode.Id,
                        CategoryId = cid
                    });
                }
            }
        }

        await _db.SaveChangesAsync();
        return Ok(new { episode.Id });
    }
}