using Microsoft.AspNetCore.Mvc;
using PersonalPodcast.Services;

namespace PersonalPodcast.Controllers;

[ApiController]
[Route("api/upload")]
public class UploadController : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Upload(
        [FromServices] CloudinaryService cloudinary,
        IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("No file uploaded");

        var url = await cloudinary.UploadAudioAsync(file);

        return Ok(new { audioUrl = url });
    }
}
