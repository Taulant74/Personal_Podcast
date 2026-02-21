namespace PersonalPodcast.Services
{
    public interface IValidationService
    {
        bool IsValidUsername(string? username);
        bool IsValidPassword(string? password);
        bool IsValidEmail(string? email);
    }
}
