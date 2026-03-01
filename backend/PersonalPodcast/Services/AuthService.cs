using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using PersonalPodcast.Data;
using PersonalPodcast.DTOs.AuthDTOs;
using PersonalPodcast.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace PersonalPodcast.Services
{
    public class AuthService : IAuthService
    {
        private readonly PodcastDbContext _db;
        private readonly IConfiguration _config;
        private readonly IValidationService _validation;

        public AuthService(PodcastDbContext db, IConfiguration config, IValidationService validation)
        {
            _db = db;
            _config = config;
            _validation = validation;
        }

        public async Task<(RegisterResponseDto response, string? refreshToken)> RegisterAsync(RegisterRequestDto request)
        {
            var response = new RegisterResponseDto();

            if (!_validation.IsValidUsername(request.Username))
            {
                response.success = false;
                response.message = "Username cannot contain symbols or spaces. Only letters and numbers are allowed.";
                return (response, null);
            }

            if (_db.Users.Any(u => u.Username == request.Username))
            {
                response.success = false;
                response.message = "Username already exists.";
                return (response, null);
            }

            if (!_validation.IsValidPassword(request.Password))
            {
                response.success = false;
                response.message = "Password must be at least 8 characters long and contain at least one letter and one number.";
                return (response, null);
            }

            var salt = BCrypt.Net.BCrypt.GenerateSalt();
            var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password, salt);

            var newUser = new User
            {
                Username = request.Username,
                FirstName = request.FirstName,
                LastName = request.LastName,
                PasswordHash = passwordHash,
                PasswordSalt = salt,
                Role = "User",
                CreatedAt = DateTime.UtcNow
            };

            _db.Users.Add(newUser);
            await _db.SaveChangesAsync();

            var token = GenerateToken(newUser, TimeSpan.FromMinutes(15));
            var refreshToken = GenerateToken(newUser, TimeSpan.FromDays(7));

            response.success = true;
            response.message = "User registered successfully.";
            response.AccessToken = token;

            return (response, refreshToken);
        }

        public async Task<(RegisterResponseDto response, string? refreshToken)> LoginAsync(LoginRequestDto request)
        {
            var response = new RegisterResponseDto();

            if (!_validation.IsValidPassword(request.Password))
            {
                response.success = false;
                response.message = "Password must be at least 8 characters long and contain at least one letter and one number.";
                return (response, null);
            }

            User? user = null;

            if (request.Identifier.Contains("@"))
            {
                user = await _db.Users.FirstOrDefaultAsync(u => u.Email == request.Identifier);
            }
            else
            {
                user = await _db.Users.FirstOrDefaultAsync(u => u.Username == request.Identifier);
            }

            if (user == null)
            {
                response.success = false;
                response.message = "Invalid identifier or password.";
                return (response, null);
            }

            var isPasswordValid = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);
            if (!isPasswordValid)
            {
                response.success = false;
                response.message = "Invalid identifier or password.";
                return (response, null);
            }

            var accessToken = GenerateToken(user, TimeSpan.FromMinutes(15));
            var refreshToken = GenerateToken(user, TimeSpan.FromDays(7));

            response.success = true;
            response.message = "Login successful.";
            response.AccessToken = accessToken;

            return (response, refreshToken);
        }

        public string? RefreshAccessToken(string refreshToken)
        {
            var principal = GetPrincipalFromToken(refreshToken);

            if (principal == null)
                return null;

            var userId = principal.FindFirstValue(ClaimTypes.Sid);
            var username = principal.FindFirstValue(ClaimTypes.Name);
            var role = principal.FindFirstValue(ClaimTypes.Role);

            if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(username) || string.IsNullOrEmpty(role))
                return null;

            var user = _db.Users.FirstOrDefault(u => u.Id == int.Parse(userId));
            if (user == null)
                return null;

            var allegedUser = new User
            {
                Id = int.Parse(userId),
                Username = username,
                Role = role
            };

            var newAccessToken = GenerateToken(allegedUser, TimeSpan.FromMinutes(15));
            return newAccessToken;
        }

        private string GenerateToken(User user, TimeSpan expiry)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Sid, user.Id.ToString()),
                new Claim(ClaimTypes.Role, user.Role),
                new Claim(ClaimTypes.Name, user.Username)
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));

            // CHANGED BACK TO HmacSha512Signature to match your original code!
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha512Signature);

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.Add(expiry),
                SigningCredentials = creds,
                Issuer = _config["Jwt:Issuer"],
                Audience = _config["Jwt:Audience"]
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);

            return tokenHandler.WriteToken(token);
        }

        private ClaimsPrincipal? GetPrincipalFromToken(string token)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(_config["Jwt:Key"]!);

            try
            {
                var principal = tokenHandler.ValidateToken(token, new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ValidateIssuer = true,
                    ValidIssuer = _config["Jwt:Issuer"],
                    ValidateAudience = true,
                    ValidAudience = _config["Jwt:Audience"],
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero
                }, out SecurityToken validatedToken);

                return principal;
            }
            catch
            {
                return null;
            }
        }
    }
}