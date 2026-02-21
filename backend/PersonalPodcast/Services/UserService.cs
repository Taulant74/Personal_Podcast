using PersonalPodcast.Data;
using PersonalPodcast.DTOs.UserDTOs;
using PersonalPodcast.Models;

namespace PersonalPodcast.Services
{
    public class UserService : IUserService
    {
        private readonly PodcastDbContext _db;
        private readonly IValidationService _validation;

        public UserService(PodcastDbContext db, IValidationService validation)
        {
            _db = db;
            _validation = validation;
        }

        public async Task<GetUserDto?> GetByIdAsync(int id)
        {
            var user = await _db.Users.FindAsync(id);
            if (user == null)
                return null;

            return new GetUserDto
            {
                Id = user.Id,
                Username = user.Username,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Age = user.Age,
                Email = user.Email,
                Role = user.Role,
                CreatedAt = user.CreatedAt
            };
        }

        public async Task<(GetUserDto? dto, string? error)> UpdateAsync(int id, UpdateUserDto request)
        {
            var user = await _db.Users.FindAsync(id);
            if (user == null)
                return (null, "User not found.");

            if (!string.IsNullOrEmpty(request.Username))
            {
                if (!_validation.IsValidUsername(request.Username))
                    return (null, "Username cannot contain symbols. Only letters and numbers are allowed.");

                if (_db.Users.Any(u => u.Username == request.Username && u.Id != id))
                    return (null, "Username already exists.");

                user.Username = request.Username;
            }

            if (!string.IsNullOrEmpty(request.FirstName))
                user.FirstName = request.FirstName;

            if (!string.IsNullOrEmpty(request.LastName))
                user.LastName = request.LastName;

            if (request.Age.HasValue)
                user.Age = request.Age.Value;

            if (!string.IsNullOrEmpty(request.Email))
            {
                if (!_validation.IsValidEmail(request.Email))
                    return (null, "Invalid email format.");

                user.Email = request.Email;
            }

            if (!string.IsNullOrEmpty(request.Role))
            {
                // Role change permission should be enforced by controller
                user.Role = request.Role;
            }

            await _db.SaveChangesAsync();

            var dto = new GetUserDto
            {
                Id = user.Id,
                Username = user.Username,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Age = user.Age,
                Email = user.Email,
                Role = user.Role,
                CreatedAt = user.CreatedAt
            };

            return (dto, null);
        }

        public async Task<(bool success, string? error)> DeleteAsync(int id)
        {
            var user = await _db.Users.FindAsync(id);
            if (user == null)
                return (false, "User not found.");

            _db.Users.Remove(user);
            await _db.SaveChangesAsync();

            return (true, null);
        }
    }
}
