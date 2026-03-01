using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PersonalPodcast.Data;
using PersonalPodcast.DTOs.UserDTOs;
using PersonalPodcast.Models;
using PersonalPodcast.Services;
using System.Security.Claims;

namespace PersonalPodcast.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UserController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly IValidationService _validation;

        public UserController(IUserService userService, IValidationService validation)
        {
            _userService = userService;
            _validation = validation;
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<GetUserDto>> GetUserById(int id)
        {
            var callerIdClaim = User.FindFirstValue(ClaimTypes.Sid);
            var callerRole = User.FindFirstValue(ClaimTypes.Role);

            if (string.IsNullOrEmpty(callerIdClaim))
                return Unauthorized("Invalid user.");

            var callerId = int.Parse(callerIdClaim);

            if (callerId != id && !string.Equals(callerRole, "Admin", StringComparison.OrdinalIgnoreCase))
                return Forbid();

            var dto = await _userService.GetByIdAsync(id);
            if (dto == null)
                return NotFound();

            return Ok(dto);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<GetUserDto>> UpdateUser(int id, UpdateUserDto request)
        {
            var callerIdClaim = User.FindFirstValue(ClaimTypes.Sid);
            var callerRole = User.FindFirstValue(ClaimTypes.Role);

            if (string.IsNullOrEmpty(callerIdClaim))
                return Unauthorized("Invalid user.");

            var callerId = int.Parse(callerIdClaim);

            if (callerId != id && !string.Equals(callerRole, "Admin", StringComparison.OrdinalIgnoreCase))
                return Forbid();

            if (!string.IsNullOrEmpty(request.Role) && !string.Equals(callerRole, "Admin", StringComparison.OrdinalIgnoreCase))
                return Forbid();

            if (!string.IsNullOrEmpty(request.Password))
            {
                if (!_validation.IsValidPassword(request.Password)) 
                {
                    return BadRequest("Password must be at least 8 characters long,must have a letter and a number.");
                }
            }

            var (dto, error) = await _userService.UpdateAsync(id, request);

            if (!string.IsNullOrEmpty(error))
                return BadRequest(error);

            return Ok(dto);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var callerIdClaim = User.FindFirstValue(ClaimTypes.Sid);
            var callerRole = User.FindFirstValue(ClaimTypes.Role);

            if (string.IsNullOrEmpty(callerIdClaim))
                return Unauthorized("Invalid user.");

            var callerId = int.Parse(callerIdClaim);

            if (callerId != id && !string.Equals(callerRole, "Admin", StringComparison.OrdinalIgnoreCase))
                return Forbid();

            var (success, error) = await _userService.DeleteAsync(id);
            if (!success)
                return NotFound(error);

            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = false,
                SameSite = SameSiteMode.Lax,
                Path = "/api/auth"
            };

            Response.Cookies.Delete("refreshToken", cookieOptions);

            return Ok(new { message = "User deleted and logged out." });
        }
    }
}
