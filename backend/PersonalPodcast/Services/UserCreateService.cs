using PersonalPodcast.Data;
using PersonalPodcast.Models;
using Microsoft.EntityFrameworkCore;

namespace PersonalPodcast.Services
{
    public class UserCreateService
    {
        private readonly PodcastDbContext _db;

        public UserCreateService(PodcastDbContext db)
        {
            _db = db;
        }

        public async Task<(bool ok, string? error, User? user)> CreateUserAsync(
            string username,
            string firstName,
            string lastName,
            string password,
            string role = "User",
            int? age = null,
            string? email = null)
        {
            if (string.IsNullOrWhiteSpace(username))
                return (false, "Username is required.", null);

            if (!IsValidPassword(password))
                return (false, "Password must be at least 8 characters long and contain at least one letter and one number.", null);

            if (await _db.Users.AnyAsync(u => u.Username == username))
                return (false, "Username already exists.", null);

            if (!string.IsNullOrWhiteSpace(email) && await _db.Users.AnyAsync(u => u.Email == email))
                return (false, "Email already exists.", null);

            var salt = BCrypt.Net.BCrypt.GenerateSalt();
            var hash = BCrypt.Net.BCrypt.HashPassword(password, salt);

            var user = new User
            {
                Username = username.Trim(),
                FirstName = firstName.Trim(),
                LastName = lastName.Trim(),
                Age = age,
                Email = string.IsNullOrWhiteSpace(email) ? null : email.Trim(),
                Role = string.IsNullOrWhiteSpace(role) ? "User" : role.Trim(),
                PasswordSalt = salt,
                PasswordHash = hash,
                CreatedAt = DateTime.UtcNow
            };

            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            return (true, null, user);
        }

        private bool IsValidPassword(string? password)
        {
            if (string.IsNullOrEmpty(password)) return false;
            if (password.Length < 8) return false;

            bool hasLetter = false, hasDigit = false;
            foreach (var c in password)
            {
                if (char.IsLetter(c)) hasLetter = true;
                if (char.IsDigit(c)) hasDigit = true;
                if (hasLetter && hasDigit) return true;
            }
            return false;
        }
    }
}

