using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PersonalPodcast.Data;
using PersonalPodcast.Models;
using PersonalPodcast.Services;

namespace PersonalPodcast.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AdminController : ControllerBase
    {
        private readonly CloudinaryService _cloudinary;
        private readonly PodcastDbContext _db;

        public AdminController(PodcastDbContext db, CloudinaryService cloudinary)
        {
            _cloudinary = cloudinary;
            _db = db;
        }

        private static List<int> ParseIds(string? csv)
        {
            if (string.IsNullOrWhiteSpace(csv)) return new List<int>();

            return csv
                .Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(x => x.Trim())
                .Select(x => int.TryParse(x, out var v) ? v : (int?)null)
                .Where(x => x.HasValue && x.Value > 0)
                .Select(x => x!.Value)
                .Distinct()
                .ToList();
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var episodes = await _db.Episodes
                .AsNoTracking()
                .Where(e => e.IsPublished)
                .OrderByDescending(e => e.PublishedDate ?? e.CreatedAt)
                .Select(e => new
                {
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
                    Categories = e.EpisodeCategories
                        .Where(ec => ec.Category != null)
                        .Select(ec => ec.Category!.Name)
                        .ToList()
                })
                .ToListAsync();

            return Ok(episodes);
        }

        [HttpPost]
        public async Task<IActionResult> Upload(
            [FromForm] string title,
            [FromForm] string? description,
            [FromForm] string? categoryIds,
            [FromForm] int? season,
            [FromForm] bool isPublished,
            IFormFile file)
        {
            if (string.IsNullOrWhiteSpace(title))
                return BadRequest("Title is required.");

            if (file == null || file.Length == 0)
                return BadRequest("Audio file is required.");

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
                CreatedAt = DateTime.UtcNow
            };

            var ids = ParseIds(categoryIds);

            if (ids.Count > 0)
            {
                var cats = await _db.Categories
                    .Where(c => ids.Contains(c.Id))
                    .ToListAsync();

                if (cats.Count != ids.Count)
                    return BadRequest("One or more categoryIds are invalid.");

                foreach (var c in cats)
                {
                    episode.EpisodeCategories.Add(new EpisodeCategory
                    {
                        CategoryId = c.Id
                    });
                }
            }

            _db.Episodes.Add(episode);
            await _db.SaveChangesAsync();

            return Ok(episode);
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(
            int id,
            [FromForm] string title,
            [FromForm] string? description,
            [FromForm] string? categoryIds,
            [FromForm] int? season,
            [FromForm] bool isPublished,
            IFormFile? file)
        {
            var episode = await _db.Episodes
                .Include(e => e.EpisodeCategories)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (episode == null)
                return NotFound("Episode not found.");

            if (string.IsNullOrWhiteSpace(title))
                return BadRequest("Title is required.");

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
                if (!episode.IsPublished)
                    episode.PublishedDate = DateTime.UtcNow;

                episode.IsPublished = true;
            }

            var ids = ParseIds(categoryIds);

            episode.EpisodeCategories.Clear();

            if (ids.Count > 0)
            {
                var cats = await _db.Categories
                    .Where(c => ids.Contains(c.Id))
                    .ToListAsync();

                if (cats.Count != ids.Count)
                    return BadRequest("One or more categoryIds are invalid.");

                foreach (var c in cats)
                {
                    episode.EpisodeCategories.Add(new EpisodeCategory
                    {
                        EpisodeId = episode.Id,
                        CategoryId = c.Id
                    });
                }
            }

            if (file != null && file.Length > 0)
            {
                var (newAudioUrl, newDurationSeconds) = await _cloudinary.UploadAudioAsync(file);
                episode.AudioUrl = newAudioUrl;
                episode.DurationSeconds = Math.Max(newDurationSeconds, 1);
            }

            await _db.SaveChangesAsync();
            return Ok(episode);
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var episode = await _db.Episodes
                .Include(e => e.EpisodeCategories)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (episode == null)
                return NotFound("Episode not found.");

            _db.Episodes.Remove(episode);
            await _db.SaveChangesAsync();

            return NoContent();
        }
    }
}