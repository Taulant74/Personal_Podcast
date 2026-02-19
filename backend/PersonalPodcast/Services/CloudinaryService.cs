using CloudinaryDotNet;
using CloudinaryDotNet.Actions;

namespace PersonalPodcast.Services;

public class CloudinaryService
{
    private readonly Cloudinary _cloudinary;

    public CloudinaryService(Cloudinary cloudinary)
    {
        _cloudinary = cloudinary;
    }

    public async Task<string> UploadAudioAsync(IFormFile file)
    {
        if (file == null || file.Length == 0)
            throw new ArgumentException("File is empty.");

        await using var stream = file.OpenReadStream();

        var uploadParams = new VideoUploadParams
        {
            File = new FileDescription(file.FileName, stream),
            Folder = "podcast_episodes",
            UseFilename = true,
            UniqueFilename = true,
            Overwrite = true
        };

        var result = await _cloudinary.UploadAsync(uploadParams);

        if (result.Error != null)
            throw new Exception($"Cloudinary error: {result.Error.Message}");

        return result.SecureUrl?.ToString()
               ?? throw new Exception("Cloudinary did not return a URL.");
    }
}
