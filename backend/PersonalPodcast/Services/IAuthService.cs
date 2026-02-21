using PersonalPodcast.DTOs.AuthDTOs;

namespace PersonalPodcast.Services
{
    public interface IAuthService
    {
        Task<(RegisterResponseDto response, string? refreshToken)> RegisterAsync(RegisterRequestDto request);
        Task<(RegisterResponseDto response, string? refreshToken)> LoginAsync(LoginRequestDto request);
        string? RefreshAccessToken(string refreshToken);
    }
}
