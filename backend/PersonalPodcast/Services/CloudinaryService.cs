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

    public async Task<string> UploadAudioAsync(IFormFile file)
    {
        if (file == null || file.Length == 0)
            throw new Exception("Audio file is missing.");

        var tempPath = Path.Combine(Path.GetTempPath(), $"{Guid.NewGuid()}_{Path.GetFileName(file.FileName)}");

        await using (var outStream = new FileStream(tempPath, FileMode.CreateNew, FileAccess.Write, FileShare.None))
        {
            await file.CopyToAsync(outStream);
        }

        try
        {
            await using var readStream = new FileStream(tempPath, FileMode.Open, FileAccess.Read, FileShare.Read);

            var uploadParams = new VideoUploadParams
            {
                File = new FileDescription(Path.GetFileName(tempPath), readStream),
                Folder = "podcast-audio",
                UseFilename = true,
                UniqueFilename = true,
                Overwrite = false
            };

            var result = await _cloudinary.UploadLargeAsync(uploadParams);

            if (result.Error != null)
                throw new Exception(result.Error.Message);

            return result.SecureUrl.ToString();
        }
        finally
        {
            try
            {
                if (File.Exists(tempPath))
                    File.Delete(tempPath);
            }
            catch
            {
            }
        }
    }

}
