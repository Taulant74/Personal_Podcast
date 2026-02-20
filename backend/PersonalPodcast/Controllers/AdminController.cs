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

        public AdminController(PodcastDbContext db, CloudinaryService cloudinary) {

            _cloudinary = cloudinary;
            _db = db;

        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var episodes = await _db.Episodes
                .Where(e => e.IsPublished)
                .OrderByDescending(e => e.PublishedDate)
                .ToListAsync();

            return Ok(episodes);
        }


        [HttpPost]
        public async Task<IActionResult> Upload(
        [FromForm] string title,
        [FromForm] string? description,
        [FromForm] string? category,
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



        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(
        int id,
        [FromForm] string title,
        [FromForm] string? description,
        [FromForm] string? category,
        [FromForm] int? season,
        [FromForm] bool isPublished,
        IFormFile? file)
        {
            var episode = await _db.Episodes.FirstOrDefaultAsync(e => e.Id == id);

            if (episode == null)
                return NotFound("Episode not found.");

            if (string.IsNullOrWhiteSpace(title))
                return BadRequest("Title is required.");

            episode.Title = title.Trim();
            episode.Description = description;
            episode.Category = category;
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
                .FirstOrDefaultAsync(e => e.Id == id);

            if (episode == null)
                return NotFound("Episode not found.");

            _db.Episodes.Remove(episode);
            await _db.SaveChangesAsync();

            return NoContent();
        }





    }
}
