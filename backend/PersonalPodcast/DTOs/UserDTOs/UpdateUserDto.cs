namespace PersonalPodcast.DTOs.UserDTOs
{
    public class UpdateUserDto
    {
        public string? Username { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public int? Age { get; set; }
        public string? Email { get; set; }
        // Optional role change - only applied when the caller is an admin
        public string? Role { get; set; }
        public string? Password { get; set; } = null;
    }
}
