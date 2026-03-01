using Microsoft.AspNetCore.Mvc;
using PersonalPodcast.DTOs.AuthDTOs;
using PersonalPodcast.Services;

namespace PersonalPodcast.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("register")]
        public async Task<ActionResult<RegisterResponseDto>> Register(RegisterRequestDto request)
        {
            var (response, refreshToken) = await _authService.RegisterAsync(request);

            if (!response.success)
            {
                return BadRequest(response);
            }

            SetRefreshTokenCookie(refreshToken!);

            return Ok(response);
        }

        [HttpPost("login")]
        public async Task<ActionResult<RegisterResponseDto>> Login(LoginRequestDto request)
        {
            var (response, refreshToken) = await _authService.LoginAsync(request);

            if (!response.success)
            {
                return BadRequest(response);
            }

            SetRefreshTokenCookie(refreshToken!);

            return Ok(response);
        }

        [HttpPost("logout")]
        public IActionResult Logout()
        {
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = false,                 
                SameSite = SameSiteMode.Lax,    
                Path = "/api/auth"
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

            var newAccessToken = _authService.RefreshAccessToken(refreshToken);

            if (newAccessToken == null)
                return Unauthorized("Invalid token or user.");

            return Ok(new { accessToken = newAccessToken });
        }

        private void SetRefreshTokenCookie(string refreshToken)
        {
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Expires = DateTimeOffset.UtcNow.AddDays(7),
                Secure = false,                 
                SameSite = SameSiteMode.Lax,    
                Path = "/api/auth"
            };
            Response.Cookies.Append("refreshToken", refreshToken, cookieOptions);
        }
    }
}