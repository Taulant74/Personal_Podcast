using PersonalPodcast.DTOs.UserDTOs;

namespace PersonalPodcast.Services
{
    public interface IUserService
    {
        Task<GetUserDto?> GetByIdAsync(int id);
        Task<(GetUserDto? dto, string? error)> UpdateAsync(int id, UpdateUserDto request);
        Task<(bool success, string? error)> DeleteAsync(int id);
    }
}
