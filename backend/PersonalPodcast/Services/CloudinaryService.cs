using CloudinaryDotNet;
using CloudinaryDotNet.Actions;

namespace PersonalPodcast.Services;

public class CloudinaryService
{
    private readonly Cloudinary _cloudinary;

    public CloudinaryService()
    {
        var cloudName = Environment.GetEnvironmentVariable("CLOUDINARY_CLOUD_NAME");
        var apiKey = Environment.GetEnvironmentVariable("CLOUDINARY_API_KEY");
        var apiSecret = Environment.GetEnvironmentVariable("CLOUDINARY_API_SECRET");

        var account = new Account(cloudName, apiKey, apiSecret);
        _cloudinary = new Cloudinary(account);
        _cloudinary.Api.Secure = true;
    }

    public async Task<(string url, int durationSeconds)> UploadAudioAsync(IFormFile file)
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

        var durationSeconds = (int)Math.Round(result.Duration);

        return (
            result.SecureUrl?.ToString()
                ?? throw new Exception("Cloudinary did not return a URL."),
            durationSeconds
        );
    }

}
