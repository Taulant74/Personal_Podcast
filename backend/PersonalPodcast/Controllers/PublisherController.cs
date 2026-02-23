using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PersonalPodcast.Data;
using PersonalPodcast.Models;
using PersonalPodcast.Services;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;

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
        var idStr =
            User.FindFirstValue(ClaimTypes.Sid)             
            ?? User.FindFirstValue("sid")                   
            ?? User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? User.FindFirstValue("sub");

        return int.TryParse(idStr, out var id) ? id : null;
    }
    private bool IsAdmin() => User.IsInRole("Admin");

    [HttpGet("episodes")]
    public async Task<IActionResult> MyEpisodes()
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var q = _db.Episodes.AsNoTracking();

        if (!IsAdmin())
            q = q.Where(e => e.PublisherId == userId);

        var items = await q
            .OrderByDescending(e => e.CreatedAt)
            .Select(e => new {
                e.Id,
                e.Title,
                e.Description,
                e.AudioUrl,
                e.DurationSeconds,
                e.Season,
                e.IsPublished,
                e.PublishedDate,
                e.PlayCount,
                e.CreatedAt,
                e.PublisherId
            })
            .ToListAsync();

        return Ok(items);
    }
    [HttpDelete("episodes/{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var episode = await _db.Episodes.FirstOrDefaultAsync(e => e.Id == id);
        if (episode == null) return NotFound("Episode not found.");

        // ownership check (publishers only)
        if (!IsAdmin() && episode.PublisherId != userId)
            return Forbid();

        _db.Episodes.Remove(episode);
        await _db.SaveChangesAsync();

        return NoContent(); // 204
    }

    [HttpPost("episodes")]
    public async Task<IActionResult> Upload(
        [FromForm] string title,
        [FromForm] string? description,
        [FromForm] int? season,
        [FromForm] bool isPublished,
        [FromForm] IFormFile file)
    {
        if (string.IsNullOrWhiteSpace(title)) return BadRequest("Title is required.");
        if (file == null || file.Length == 0) return BadRequest("Audio file is required.");

        var userId = GetUserId();
        if (userId == null) return Unauthorized();

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
            PublisherId = userId // ownership of the episode
        };

        _db.Episodes.Add(episode);
        await _db.SaveChangesAsync();

        return Ok(new { episode.Id, episode.Title, episode.IsPublished, episode.PublisherId });
    }

    [HttpPut("episodes/{id:int}")]
    public async Task<IActionResult> Update(int id,
        [FromForm] string title,
        [FromForm] string? description,
        [FromForm] int? season,
        [FromForm] bool isPublished,
        [FromForm] IFormFile? file)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var episode = await _db.Episodes.FirstOrDefaultAsync(e => e.Id == id);
        if (episode == null) return NotFound("Episode not found.");

        // ownership check (publishers only)
        if (!IsAdmin() && episode.PublisherId != userId)
            return Forbid();

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

        await _db.SaveChangesAsync();
        return Ok(new { episode.Id, episode.IsPublished });
    }
}