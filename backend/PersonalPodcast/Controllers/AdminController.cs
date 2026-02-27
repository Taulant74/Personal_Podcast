using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PersonalPodcast.Data;
using PersonalPodcast.DTOs.Users;
using PersonalPodcast.Models;
using PersonalPodcast.Services;
using PersonalPodcast.DTOs.Episodes;

namespace PersonalPodcast.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly CloudinaryService _cloudinary;
        private readonly PodcastDbContext _db;
        private readonly UserCreateService _UserCreateService;

        public AdminController(PodcastDbContext db, CloudinaryService cloudinary, UserCreateService UserCreateService)
        {
            _UserCreateService = UserCreateService;
            _cloudinary = cloudinary;
            _db = db;
        }

        private static readonly HashSet<string> AllowedRoles =
            new(StringComparer.OrdinalIgnoreCase) { "User", "Publisher", "Admin" };

        private static string NormalizeRoleOrThrow(string? role, string fallback)
        {
            var r = (role ?? "").Trim();
            if (string.IsNullOrWhiteSpace(r)) return fallback;

            if (!AllowedRoles.Contains(r))
                throw new ArgumentException("Invalid role. Allowed roles: User, Publisher, Admin.");

            r = r.ToLowerInvariant();
            return char.ToUpperInvariant(r[0]) + r.Substring(1);
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
            string role;
            try
            {
                role = NormalizeRoleOrThrow(request.Role, "User");
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }

            var (ok, error, user) = await _UserCreateService.CreateUserAsync(
                request.Username,
                request.FirstName,
                request.LastName,
                request.Password,
                role,
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

            try
            {
                user.Role = NormalizeRoleOrThrow(request.Role, user.Role);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }

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

        private static List<int> ParseCategoryIds(string? csv)
        {
            if (string.IsNullOrWhiteSpace(csv)) return new List<int>();

            return csv.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(s => int.TryParse(s, out var id) ? id : (int?)null)
                .Where(id => id.HasValue && id.Value > 0)
                .Select(id => id!.Value)
                .Distinct()
                .ToList();
        }

        private async Task<object?> BuildEpisodeResponse(int episodeId)
        {
            var episode = await _db.Episodes
                .AsNoTracking()
                .Include(e => e.EpisodeCategories)
                    .ThenInclude(ec => ec.Category)
                .FirstOrDefaultAsync(e => e.Id == episodeId);

            if (episode == null) return null;

            return new
            {
                id = episode.Id,
                title = episode.Title,
                description = episode.Description,
                audioUrl = episode.AudioUrl,
                durationSeconds = episode.DurationSeconds,
                season = episode.Season,
                isPublished = episode.IsPublished,
                isPremium = episode.IsPremium,
                publishedDate = episode.PublishedDate,
                playCount = episode.PlayCount,
                createdAt = episode.CreatedAt,
                categories = episode.EpisodeCategories
                    .Where(ec => ec.Category != null)
                    .Select(ec => ec.Category!.Name)
                    .Distinct()
                    .ToList()
            };
        }

        [HttpGet("episodes")]
        public async Task<IActionResult> GetAll()
        {
            var episodes = await _db.Episodes
                .AsNoTracking()
                .Where(e => e.IsPublished)
                .Include(e => e.EpisodeCategories)
                    .ThenInclude(ec => ec.Category)
                .OrderByDescending(e => e.PublishedDate)
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
                    isPremium = e.IsPremium,
                    playCount = e.PlayCount,
                    createdAt = e.CreatedAt,
                    categories = e.EpisodeCategories
                        .Where(ec => ec.Category != null)
                        .Select(ec => ec.Category!.Name)
                        .Distinct()
                        .ToList()
                })
                .ToListAsync();

            return Ok(episodes);
        }

        [HttpPost("episodes")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> Upload([FromForm] CreateEpisodeFormRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Title))
                return BadRequest("Title is required.");

            if (request.File == null || request.File.Length == 0)
                return BadRequest("Audio file is required.");

            var ids = ParseCategoryIds(request.CategoryIds);

            if (ids.Count > 0)
            {
                var existing = await _db.Categories
                    .Where(c => ids.Contains(c.Id))
                    .Select(c => c.Id)
                    .ToListAsync();

                var missing = ids.Except(existing).ToList();
                if (missing.Count > 0)
                    return BadRequest($"Invalid category id(s): {string.Join(", ", missing)}");
            }

            var (audioUrl, durationSeconds) = await _cloudinary.UploadAudioAsync(request.File);

            var episode = new Episode
            {
                Title = request.Title.Trim(),
                Description = request.Description,
                AudioUrl = audioUrl,
                DurationSeconds = Math.Max(durationSeconds, 1),
                Season = request.Season,
                IsPublished = request.IsPublished,
                IsPremium = request.IsPremium,
                PublishedDate = request.IsPublished ? DateTime.UtcNow : null,
                PlayCount = 0,
                CreatedAt = DateTime.UtcNow
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

            var response = await BuildEpisodeResponse(episode.Id);
            return Ok(response ?? episode);
        }

        [HttpPut("episodes/{id:int}")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> Update(int id, [FromForm] UpdateEpisodeFormRequest request)
        {
            var episode = await _db.Episodes
                .Include(e => e.EpisodeCategories)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (episode == null)
                return NotFound("Episode not found.");

            if (string.IsNullOrWhiteSpace(request.Title))
                return BadRequest("Title is required.");

            episode.Title = request.Title.Trim();
            episode.Description = request.Description;
            episode.Season = request.Season;
            episode.IsPremium = request.IsPremium;

            if (!request.IsPublished)
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

            if (request.File != null && request.File.Length > 0)
            {
                var (newAudioUrl, newDurationSeconds) = await _cloudinary.UploadAudioAsync(request.File);
                episode.AudioUrl = newAudioUrl;
                episode.DurationSeconds = Math.Max(newDurationSeconds, 1);
            }

            var ids = ParseCategoryIds(request.CategoryIds);

            if (ids.Count > 0)
            {
                var existing = await _db.Categories
                    .Where(c => ids.Contains(c.Id))
                    .Select(c => c.Id)
                    .ToListAsync();

                var missing = ids.Except(existing).ToList();
                if (missing.Count > 0)
                    return BadRequest($"Invalid category id(s): {string.Join(", ", missing)}");
            }

            if (episode.EpisodeCategories != null && episode.EpisodeCategories.Count > 0)
            {
                _db.Set<EpisodeCategory>().RemoveRange(episode.EpisodeCategories);
            }

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

            await _db.SaveChangesAsync();

            var response = await BuildEpisodeResponse(episode.Id);
            return Ok(response ?? episode);
        }

        [HttpDelete("episodes/{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var episode = await _db.Episodes
                .Include(e => e.EpisodeCategories)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (episode == null)
                return NotFound("Episode not found.");

            if (episode.EpisodeCategories != null && episode.EpisodeCategories.Count > 0)
            {
                _db.Set<EpisodeCategory>().RemoveRange(episode.EpisodeCategories);
            }

            _db.Episodes.Remove(episode);
            await _db.SaveChangesAsync();

            return NoContent();
        }
    }
}