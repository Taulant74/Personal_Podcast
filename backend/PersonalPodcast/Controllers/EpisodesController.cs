using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PersonalPodcast.Data;
using PersonalPodcast.DTOs.Common;
using PersonalPodcast.DTOs.Episodes;

namespace PersonalPodcast.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EpisodesController : ControllerBase
    {
        private readonly PodcastDbContext _db;

        public EpisodesController(PodcastDbContext db)
        {
            _db = db;
        }

        [HttpPost("{id:int}/play")]
        public async Task<IActionResult> IncrementPlay([FromRoute] int id)
        {
            var updated = await _db.Episodes
                .Where(e => e.Id == id && e.IsPublished)
                .ExecuteUpdateAsync(setters =>
                    setters.SetProperty(e => e.PlayCount, e => e.PlayCount + 1));

            if (updated == 0)
                return NotFound(new { message = "Episode not found." });

            var playCount = await _db.Episodes
                .Where(e => e.Id == id)
                .Select(e => e.PlayCount)
                .FirstAsync();

            return Ok(new { id, playCount });
        }

        [HttpGet("search")]
        public async Task<ActionResult<PagedResultDto<EpisodeSearchItemDto>>> Search([FromQuery] EpisodeSearchRequestDto? request)
        {
            request ??= new EpisodeSearchRequestDto();

            if (request.Page < 1) request.Page = 1;
            if (request.PageSize < 1) request.PageSize = 10;
            if (request.PageSize > 50) request.PageSize = 50;

            var query = _db.Episodes
                .AsNoTracking()
                .Where(e => e.IsPublished);

            if (!string.IsNullOrWhiteSpace(request.Title))
            {
                var title = request.Title.Trim();
                query = query.Where(e => EF.Functions.Like(e.Title, $"%{title}%"));
            }

            if (request.CategoryId is not null)
            {
                var catId = request.CategoryId.Value;
                query = query.Where(e => e.EpisodeCategories.Any(ec => ec.CategoryId == catId));
            }

            if (!string.IsNullOrWhiteSpace(request.Q))
            {
                var term = request.Q.Trim();

                query = query.Where(e =>
                    EF.Functions.Like(e.Title, $"%{term}%") ||
                    (e.Publisher != null && (
                        EF.Functions.Like(e.Publisher.Username, $"%{term}%") ||
                        EF.Functions.Like(e.Publisher.FirstName, $"%{term}%")
                    ))
                );
            }


 
            var total = await query.CountAsync();

            var sortBy = (request.SortBy ?? "date").ToLowerInvariant();
            var sortDir = (request.SortDir ?? "desc").ToLowerInvariant();
            var asc = sortDir == "asc";

            query = sortBy switch
            {
                "title" => asc ? query.OrderBy(e => e.Title) : query.OrderByDescending(e => e.Title),
                "playcount" => asc ? query.OrderBy(e => e.PlayCount) : query.OrderByDescending(e => e.PlayCount),
                _ => asc
                    ? query.OrderBy(e => e.PublishedDate ?? e.CreatedAt)
                    : query.OrderByDescending(e => e.PublishedDate ?? e.CreatedAt)
            };

            var raw = await query
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .Select(e => new
                {
                    e.Id,
                    e.Title,
                    e.Description,
                    e.AudioUrl,
                    e.DurationSeconds,
                    e.PublishedDate,
                    e.PlayCount,
                    e.IsPremium, 
                    Categories = e.EpisodeCategories
                        .Where(ec => ec.Category != null)
                        .Select(ec => ec.Category!.Name)
                        .Distinct(),
                    PublisherName = e.Publisher != null
    ? e.Publisher.FirstName + " " + e.Publisher.LastName
    : null,
                })
                .ToListAsync();

            var items = raw.Select(e => new EpisodeSearchItemDto
            {
                Id = e.Id,
                Title = e.Title,
                Description = e.Description,

                AudioUrl = e.IsPremium ? "" : e.AudioUrl,

                DurationSeconds = e.DurationSeconds,
                PublishedDate = e.PublishedDate,
                PlayCount = e.PlayCount,
                IsPremium = e.IsPremium,
                PublisherName = e.PublisherName,
                Categories = e.Categories.ToList()
            }).ToList();

            return Ok(new PagedResultDto<EpisodeSearchItemDto>
            {
                Page = request.Page,
                PageSize = request.PageSize,
                Total = total,
                Items = items
            });
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<EpisodeDetailsDto>> GetById([FromRoute] int id)
        {
            var raw = await _db.Episodes
                .AsNoTracking()
                .Where(e => e.IsPublished && e.Id == id)
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
                    e.IsPremium, 
                    e.PlayCount,
                    e.CreatedAt,
                    Categories = e.EpisodeCategories
                        .Where(ec => ec.Category != null)
                        .Select(ec => ec.Category!.Name)
                })
                .FirstOrDefaultAsync();

            if (raw == null)
            {
                return NotFound(new { message = "Episode not found." });
            }

            var dto = new EpisodeDetailsDto
            {
                Id = raw.Id,
                Title = raw.Title,
                Description = raw.Description,

                AudioUrl = raw.AudioUrl,

                DurationSeconds = raw.DurationSeconds,
                Season = raw.Season,
                IsPublished = raw.IsPublished,
                IsPremium = raw.IsPremium, 
                PublishedDate = raw.PublishedDate,
                PlayCount = raw.PlayCount,
                CreatedAt = raw.CreatedAt,
                Categories = raw.Categories
                    .Where(n => !string.IsNullOrWhiteSpace(n))
                    .Distinct()
                    .ToList()
            };

            return Ok(dto);
        }

        [HttpGet("top-by-category")]
        public async Task<ActionResult<List<TopEpisodeByCategoryDto>>> TopByCategory([FromQuery] int limit = 6)
        {
            if (limit < 1) limit = 1;
            if (limit > 50) limit = 50;

            var raw = await _db.Categories
                .AsNoTracking()
                .Select(c => new
                {
                    c.Id,
                    c.Name,
                    TopEpisode = c.EpisodeCategories
                        .Select(ec => ec.Episode)
                        .Where(e => e != null && e.IsPublished)
                        .OrderByDescending(e => e!.PlayCount)
                        .ThenByDescending(e => e!.PublishedDate ?? e!.CreatedAt)
                        .Select(e => new
                        {
                            e!.Id,
                            e.Title,
                            e.Description,
                            e.AudioUrl,
                            e.DurationSeconds,
                            e.PublishedDate,
                            e.PlayCount,
                            e.IsPremium, 
                            Categories = e.EpisodeCategories
                                .Where(ec => ec.Category != null)
                                .Select(ec => ec.Category!.Name)
                                .Distinct()
                        })
                        .FirstOrDefault()
                })
                .Where(x => x.TopEpisode != null)
                .OrderByDescending(x => x.TopEpisode!.PlayCount)
                .Take(limit)
                .ToListAsync();

            var result = raw.Select(x => new TopEpisodeByCategoryDto
            {
                CategoryId = x.Id,
                CategoryName = x.Name,

                EpisodeId = x.TopEpisode!.Id,
                Title = x.TopEpisode!.Title,
                Description = x.TopEpisode!.Description,

                AudioUrl = x.TopEpisode!.AudioUrl,

                DurationSeconds = x.TopEpisode!.DurationSeconds,
                PublishedDate = x.TopEpisode!.PublishedDate,
                PlayCount = x.TopEpisode!.PlayCount,
                Categories = x.TopEpisode!.Categories.ToList()
            }).ToList();

            return Ok(result);
        }
    }
}