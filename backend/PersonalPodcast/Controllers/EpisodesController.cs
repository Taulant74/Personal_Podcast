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

            if (!string.IsNullOrWhiteSpace(request.Q))
            {
                var term = request.Q.Trim();

                query = query.Where(e =>
                    EF.Functions.Like(e.Title, $"%{term}%") ||
                    (e.Description != null && EF.Functions.Like(e.Description, $"%{term}%")) ||
                    e.EpisodeCategories.Any(ec =>
                        ec.Category != null && EF.Functions.Like(ec.Category.Name, $"%{term}%"))
                );
            }

            var sortBy = (request.SortBy ?? "date").Trim().ToLowerInvariant();
            var sortDir = (request.SortDir ?? "desc").Trim().ToLowerInvariant();
            var asc = sortDir == "asc";

            var total = await query.CountAsync();

            query = sortBy switch
            {
                "title" => asc
                    ? query.OrderBy(e => e.Title).ThenBy(e => e.Id)
                    : query.OrderByDescending(e => e.Title).ThenByDescending(e => e.Id),

                "playcount" => asc
                    ? query.OrderBy(e => e.PlayCount).ThenBy(e => e.Id)
                    : query.OrderByDescending(e => e.PlayCount).ThenByDescending(e => e.Id),

                _ => asc
                    ? query.OrderBy(e => e.PublishedDate ?? e.CreatedAt).ThenBy(e => e.Id)
                    : query.OrderByDescending(e => e.PublishedDate ?? e.CreatedAt).ThenByDescending(e => e.Id),
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
                    Categories = e.EpisodeCategories
                        .Where(ec => ec.Category != null)
                        .Select(ec => ec.Category!.Name)
                })
                .ToListAsync();


            var items = raw.Select(e => new EpisodeSearchItemDto
            {
                Id = e.Id,
                Title = e.Title,
                Description = e.Description,
                AudioUrl = e.AudioUrl,
                DurationSeconds = e.DurationSeconds,
                PublishedDate = e.PublishedDate,
                PlayCount = e.PlayCount,
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
    }
}
