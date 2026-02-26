using Microsoft.AspNetCore.Identity.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using PersonalPodcast.Data;
using PersonalPodcast.DTOs.AuthDTOs;
using PersonalPodcast.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace PersonalPodcast.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {

        private readonly PodcastDbContext _db;
        private readonly IConfiguration _config;

        public AuthController(PodcastDbContext database, IConfiguration config)
        {
            _db = database;
            _config = config;
        }

        [HttpPost("register")]
        public async Task<ActionResult<RegisterResponseDto>> Register(RegisterRequestDto request)
        {
            var response = new RegisterResponseDto();

            if (_db.Users.Any(u => u.Username == request.Username))
            {
                response.success = false;
                response.message = "Username already exists.";

                return BadRequest(response);
            }

            if (!IsValidPassword(request.Password))
            {
                response.success = false;
                response.message = "Password must be at least 8 characters long and contain at least one letter and one number.";
                return BadRequest(response);
            }

            string salt = BCrypt.Net.BCrypt.GenerateSalt();
            string PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password, salt);

            var newUser = new User
            {
                Username = request.Username,
                FirstName = request.FirstName,
                LastName = request.LastName,
                PasswordHash = PasswordHash,
                PasswordSalt = salt,
                Role = "User",
                CreatedAt = DateTime.UtcNow
            };

            _db.Users.Add(newUser);
            await _db.SaveChangesAsync();

            var token = GenerateToken(newUser, TimeSpan.FromMinutes(15));
            var refreshToken = GenerateToken(newUser, TimeSpan.FromDays(7));

            SetRefreshTokenCookie(refreshToken);

            response.success = true;
            response.message = "User registered successfully.";
            response.AccessToken = token;

            return Ok(response);
        }

        [HttpPost("login")]
        public async Task<ActionResult<RegisterResponseDto>> Login(LoginRequestDto request)
        {
            var response = new RegisterResponseDto();
            User? user = null;

            if (!IsValidPassword(request.Password))
            {
                response.success = false;
                response.message = "Password must be at least 8 characters long and contain at least one letter and one number.";
                return BadRequest(response);
            }

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
                return BadRequest(response); 
            }

            bool isPasswordValid = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);

            if (!isPasswordValid)
            {
                response.success = false;
                response.message = "Invalid identifier or password.";
                return BadRequest(response);
            }

            var accessToken = GenerateToken(user, TimeSpan.FromMinutes(15));
            var refreshToken = GenerateToken(user, TimeSpan.FromDays(7));

            SetRefreshTokenCookie(refreshToken);

            response.success = true;
            response.message = "Login successful.";
            response.AccessToken = accessToken;

            return Ok(response);
        }

        [HttpPost("logout")]
        public IActionResult Logout()
        {
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.None 
            };

            Response.Cookies.Delete("refreshToken", cookieOptions);

            return Ok(new { message = "Logged out successfully" });
        }

        [HttpPost("refresh-token")]
        public IActionResult RefreshToken()
        {
            var refreshToken = Request.Cookies["refreshToken"];
            if (string.IsNullOrEmpty(refreshToken))
                return Unauthorized("No token provided.");

            var principal = GetPrincipalFromToken(refreshToken);

            if (principal == null)
                return Unauthorized("Invalid token.");

            var userId = principal.FindFirstValue(ClaimTypes.Sid);
            var username = principal.FindFirstValue(ClaimTypes.Name);
            var role = principal.FindFirstValue(ClaimTypes.Role);

            var user = _db.Users.FirstOrDefault(u => u.Id == int.Parse(userId!));

            if (user == null)
            {
                return Unauthorized("User not found.");
            }
               
            var allegedUser = new User
            {
                Id = int.Parse(userId!),
                Username = username!,
                Role = role!
            };

            var newAccessToken = GenerateToken(allegedUser, TimeSpan.FromMinutes(15));

            return Ok(new { accessToken = newAccessToken });
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

        private void SetRefreshTokenCookie(string refreshToken)
        {
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Expires = DateTime.UtcNow.AddDays(7),
                Secure = true,
                SameSite = SameSiteMode.None
            };
            Response.Cookies.Append("refreshToken", refreshToken, cookieOptions);
        }

        // metode per validim trefresh tokenit, ja merr claimsat, dhe nese eshte valid, kthen principalin me claimsat e tokenit
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

        private bool IsValidPassword(string? password)
        {
            if (string.IsNullOrEmpty(password))
                return false;

            if (password.Length < 8)
                return false;

            bool hasLetter = false;
            bool hasDigit = false;

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
