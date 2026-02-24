using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PersonalPodcast.Data;
using PersonalPodcast.Models;

namespace PersonalPodcast.Controllers;

[ApiController]
[Route("api/getepisodes")]
public class GetEpisodesController : ControllerBase
{
    private readonly PodcastDbContext _db;

    public GetEpisodesController(PodcastDbContext db)
    {
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

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var episode = await _db.Episodes
            .FirstOrDefaultAsync(e => e.Id == id && e.IsPublished);

        if (episode == null)
            return NotFound("Episode not found.");

        return Ok(episode);
    }
}
