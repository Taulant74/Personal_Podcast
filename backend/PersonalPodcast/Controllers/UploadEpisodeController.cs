using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PersonalPodcast.Data;
using PersonalPodcast.Models;
using PersonalPodcast.Services;

namespace PersonalPodcast.Controllers;

[ApiController]
[Route("api/upload")]
public class UploadEpisodeController : ControllerBase
{
    private readonly CloudinaryService _cloudinary;
    private readonly PodcastDbContext _db;

    public UploadEpisodeController(
        CloudinaryService cloudinary,
        PodcastDbContext db)
    {
        _cloudinary = cloudinary;
        _db = db;
    }

    [HttpPost]
    public async Task<IActionResult> Upload(
        [FromForm] string title,
        [FromForm] string? description,
        [FromForm] int durationSeconds,
        [FromForm] string? category,
        [FromForm] int? season,
        [FromForm] bool isPublished,
        IFormFile file)
    {
        if (string.IsNullOrWhiteSpace(title))
            return BadRequest("Title is required.");

        if (durationSeconds <= 0)
            return BadRequest("Duration must be greater than 0.");

        if (file == null || file.Length == 0)
            return BadRequest("Audio file is required.");

  
        var audioUrl = await _cloudinary.UploadAudioAsync(file);

        var episode = new Episode
        {
            Title = title.Trim(),
            Description = description,
            AudioUrl = audioUrl,
            DurationSeconds = durationSeconds,
            Category = category,
            Season = season,
            IsPublished = isPublished,
            PublishedDate = isPublished ? DateTime.UtcNow : null,
            PlayCount = 0,
            CreatedAt = DateTime.UtcNow
        };

        _db.Episodes.Add(episode);
        await _db.SaveChangesAsync();

        return Ok(episode);
    }

    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] string q)
    {
        if (string.IsNullOrWhiteSpace(q))
            return Ok(Array.Empty<Episode>());

        var results = await _db.Episodes
            .Where(e =>
                e.IsPublished &&
                EF.Functions.Like(e.Title, $"%{q}%"))
            .OrderByDescending(e => e.PublishedDate)
            .ToListAsync();

        return Ok(results);
    }
}
