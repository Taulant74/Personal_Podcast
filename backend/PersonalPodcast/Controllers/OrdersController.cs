using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PersonalPodcast.Data;
using PersonalPodcast.DTOs.Orders;
using System.Security.Claims;

namespace PersonalPodcast.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class OrdersController : ControllerBase
    {
        private readonly PodcastDbContext _db;

        public OrdersController(PodcastDbContext db)
        {
            _db = db;
        }

        [HttpPost]
        public async Task<ActionResult<CreateOrderResponseDto>> Create([FromBody] CreateOrderRequestDto request)
        {
            if (request.EpisodeId <= 0)
                return BadRequest(new { message = "Invalid episodeId." });

            var userIdStr = User.FindFirstValue(ClaimTypes.Sid);
            if (string.IsNullOrWhiteSpace(userIdStr) || !int.TryParse(userIdStr, out var userId))
                return Unauthorized(new { message = "Invalid user token." });

            var episodeExists = await _db.Episodes
                .AsNoTracking()
                .AnyAsync(e => e.Id == request.EpisodeId && e.IsPublished);

            if (!episodeExists)
                return NotFound(new { message = "Episode not found." });

            var alreadyOrdered = await _db.Orders
                .AsNoTracking()
                .AnyAsync(o => o.UserId == userId && o.EpisodeId == request.EpisodeId);

            if (alreadyOrdered)
                return Conflict(new { message = "You already ordered this episode." });

            var order = new PersonalPodcast.Models.Order
            {
                UserId = userId,
                EpisodeId = request.EpisodeId,
                CreatedAt = DateTime.UtcNow
            };

            _db.Orders.Add(order);
            await _db.SaveChangesAsync();

            return Ok(new CreateOrderResponseDto
            {
                Id = order.Id,
                EpisodeId = order.EpisodeId,
                CreatedAt = order.CreatedAt
            });
        }

        [HttpGet]
        public async Task<IActionResult> GetOrderByUser()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.Sid);
            if (string.IsNullOrWhiteSpace(userIdStr) || !int.TryParse(userIdStr, out var userId))
                return Unauthorized(new { message = "Invalid user token." });

            var orders = await _db.Orders
                .AsNoTracking()
                .Where(o => o.UserId == userId)
                .OrderByDescending(o => o.CreatedAt)
                .Select(o => new
                {
                    orderId = o.Id,
                    episodeId = o.EpisodeId,
                    createdAt = o.CreatedAt
                })
                .ToListAsync();

            return Ok(orders);
        }

        [HttpGet("episodes/{episodeId:int}")]
        public async Task<IActionResult> GetOrderedEpisodeById(int episodeId)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.Sid);
            if (string.IsNullOrWhiteSpace(userIdStr) || !int.TryParse(userIdStr, out var userId))
                return Unauthorized(new { message = "Invalid user token." });

            var hasOrder = await _db.Orders
                .AsNoTracking()
                .AnyAsync(o => o.UserId == userId && o.EpisodeId == episodeId);

            if (!hasOrder)
                return NotFound(new { message = "Episode not found." });

            var episode = await _db.Episodes
                .AsNoTracking()
                .Where(e => e.Id == episodeId && e.IsPublished)
                .Select(e => new
                {
                    id = e.Id,
                    title = e.Title,
                    description = e.Description,
                    audioUrl = e.AudioUrl,
                    durationSeconds = e.DurationSeconds,
                    season = e.Season,
                    publishedDate = e.PublishedDate,
                    playCount = e.PlayCount,
                    createdAt = e.CreatedAt
                })
                .FirstOrDefaultAsync();

            if (episode == null)
                return NotFound(new { message = "Episode not found." });

            return Ok(episode);
        }

        [Authorize]
        [HttpGet("my-episodes")]
        public async Task<IActionResult> GetMyEpisodes()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.Sid)
                            ?? User.FindFirstValue("sid");

            if (string.IsNullOrWhiteSpace(userIdStr))
                return Unauthorized();

            if (!int.TryParse(userIdStr, out var userId))
                return Unauthorized();

            var episodes = await _db.Orders
                .Where(o => o.UserId == userId)
                .Join(_db.Episodes,
                      o => o.EpisodeId,
                      e => e.Id,
                      (o, e) => e)
                .Distinct()
                .OrderByDescending(e => e.CreatedAt)
                .Select(e => new
                {
                    e.Id,
                    e.Title,
                    e.Description,
                    e.AudioUrl,
                    e.DurationSeconds,
                    e.Season,
                    e.PublishedDate,
                    e.PlayCount,
                    e.CreatedAt
                })
                .ToListAsync();

            return Ok(episodes);
        }
    }
}