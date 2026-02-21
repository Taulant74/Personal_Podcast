using Microsoft.AspNetCore.Identity.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using PersonalPodcast.Data;
using PersonalPodcast.DTOs.AuthDTOs;
using PersonalPodcast.Models;
using PersonalPodcast.Services;
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
        private readonly IAuthService _authService;
        private readonly IValidationService _validation;

        public AuthController(PodcastDbContext database, IConfiguration config, IAuthService authService, IValidationService validation)
        {
            _db = database;
            _config = config;
            _authService = authService;
            _validation = validation;
        }

        [HttpPost("register")]
        public async Task<ActionResult<RegisterResponseDto>> Register(RegisterRequestDto request)
        {
            var (response, refreshToken) = await _authService.RegisterAsync(request);

            if (!string.IsNullOrEmpty(refreshToken))
            {
                var cookieOptions = new CookieOptions
                {
                    HttpOnly = true,
                    Expires = DateTime.UtcNow.AddDays(7),
                    Secure = true,
                    SameSite = SameSiteMode.Strict
                };
                Response.Cookies.Append("refreshToken", refreshToken, cookieOptions);
            }

            if (!response.success)
                return BadRequest(response);

            return Ok(response);
        }

        [HttpPost("login")]
        public async Task<ActionResult<RegisterResponseDto>> Login(LoginRequestDto request)
        {
            var (response, refreshToken) = await _authService.LoginAsync(request);

            if (!string.IsNullOrEmpty(refreshToken))
            {
                var cookieOptions = new CookieOptions
                {
                    HttpOnly = true,
                    Expires = DateTime.UtcNow.AddDays(7),
                    Secure = true,
                    SameSite = SameSiteMode.Strict
                };
                Response.Cookies.Append("refreshToken", refreshToken, cookieOptions);
            }

            if (!response.success)
                return BadRequest(response);

            return Ok(response);
        }

        [HttpPost("logout")]
        public IActionResult Logout()
        {
            Response.Cookies.Append("refreshToken", "", new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Strict,
                Expires = DateTime.UtcNow.AddDays(-1) 
            });

            return Ok(new { message = "Logged out successfully" });
        }

        [HttpPost("refresh-token")]
        public IActionResult RefreshToken()
        {
            var refreshToken = Request.Cookies["refreshToken"];
            if (string.IsNullOrEmpty(refreshToken))
                return Unauthorized("No token provided.");

            var newAccessToken = _authService.RefreshAccessToken(refreshToken);

            if (string.IsNullOrEmpty(newAccessToken))
                return Unauthorized("Invalid token.");

            return Ok(new { accessToken = newAccessToken });
        }
    }
}
