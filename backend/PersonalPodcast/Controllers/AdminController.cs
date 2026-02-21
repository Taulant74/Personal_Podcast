using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PersonalPodcast.Data;
using PersonalPodcast.DTOs.Users;
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
        private readonly UserCreateService _UserCreateService;

        public AdminController(PodcastDbContext db, CloudinaryService cloudinary , UserCreateService UserCreateService) {

            _UserCreateService = UserCreateService;
            _cloudinary = cloudinary;
            _db = db;

        }


        [HttpGet("users")]
        public async Task<IActionResult> GetUsers()
        {
            var users = await _db.Users
                .OrderByDescending(u => u.Id)
                .Select(u => new UserResponseDto
                {
                    Id = u.Id,
                    Username = u.Username,
                    FirstName = u.FirstName,
                    LastName = u.LastName,
                    Age = u.Age,
                    Email = u.Email,
                    Role = u.Role
                })
                .ToListAsync();

            return Ok(users);
        }

        [HttpGet("users/{id:int}")]
        public async Task<IActionResult> GetUserById(int id)
        {
            var u = await _db.Users.FirstOrDefaultAsync(x => x.Id == id);
            if (u == null) return NotFound("User not found.");

            return Ok(new UserResponseDto
            {
                Id = u.Id,
                Username = u.Username,
                FirstName = u.FirstName,
                LastName = u.LastName,
                Age = u.Age,
                Email = u.Email,
                Role = u.Role
            });
        }

        [HttpPost("users")]
        public async Task<IActionResult> CreateUser([FromBody] CreateUserDto request)
        {
            var (ok, error, user) = await _UserCreateService.CreateUserAsync(
                request.Username,
                request.FirstName,
                request.LastName,
                request.Password,
                request.Role,
                request.Age,
                request.Email
            );

            if (!ok) return BadRequest(error);

            return CreatedAtAction(nameof(GetUserById), new { id = user!.Id }, new UserResponseDto
            {
                Id = user.Id,
                Username = user.Username,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Age = user.Age,
                Email = user.Email,
                Role = user.Role
            });
        }


        [HttpPut("users/{id:int}")]
        public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserDto request)
        {
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == id);
            if (user == null) return NotFound("User not found.");

            if (string.IsNullOrWhiteSpace(request.Username))
                return BadRequest("Username is required.");

            if (await _db.Users.AnyAsync(u => u.Username == request.Username && u.Id != id))
                return BadRequest("Username already exists.");

            if (!string.IsNullOrWhiteSpace(request.Email) &&
                await _db.Users.AnyAsync(u => u.Email == request.Email && u.Id != id))
                return BadRequest("Email already exists.");

            user.Username = request.Username.Trim();
            user.FirstName = request.FirstName.Trim();
            user.LastName = request.LastName.Trim();
            user.Age = request.Age;
            user.Email = string.IsNullOrWhiteSpace(request.Email) ? null : request.Email.Trim();
            user.Role = string.IsNullOrWhiteSpace(request.Role) ? user.Role : request.Role.Trim();

            if (!string.IsNullOrWhiteSpace(request.Password))
            {

                if (request.Password.Length < 8)
                    return BadRequest("Password must be at least 8 characters.");

                var salt = BCrypt.Net.BCrypt.GenerateSalt();
                var hash = BCrypt.Net.BCrypt.HashPassword(request.Password, salt);

                user.PasswordSalt = salt;
                user.PasswordHash = hash;
            }

            await _db.SaveChangesAsync();

            return Ok(new UserResponseDto
            {
                Id = user.Id,
                Username = user.Username,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Age = user.Age,
                Email = user.Email,
                Role = user.Role
            });
        }

        [HttpDelete("users/{id:int}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == id);
            if (user == null) return NotFound("User not found.");

            _db.Users.Remove(user);
            await _db.SaveChangesAsync();

            return NoContent();
        }


       


        [HttpGet("episodes")]
        public async Task<IActionResult> GetAll()
        {
            var episodes = await _db.Episodes
                .Where(e => e.IsPublished)
                .OrderByDescending(e => e.PublishedDate)
                .ToListAsync();

            return Ok(episodes);
        }


        [HttpPost("episodes")]
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



        [HttpPut("episodes/{id:int}")]
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





        [HttpDelete("episodes/{id:int}")]

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
