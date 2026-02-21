namespace PersonalPodcast.DTOs.Users
{
    public class UpdateUserDto
    {
        public string Username { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public int? Age { get; set; }
        public string? Email { get; set; }
        public string Role { get; set; } = "User";

        // optional: only change password if provided
        public string? Password { get; set; }
    }
}
