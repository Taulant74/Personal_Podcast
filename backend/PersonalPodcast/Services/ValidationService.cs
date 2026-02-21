using System.Text.RegularExpressions;

namespace PersonalPodcast.Services
{
    public class ValidationService : IValidationService
    {
        public bool IsValidUsername(string? username)
        {
            if (string.IsNullOrWhiteSpace(username))
                return false;

            return username.All(c => char.IsLetterOrDigit(c));
        }

        public bool IsValidPassword(string? password)
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

        public bool IsValidEmail(string? email)
        {
            if (string.IsNullOrWhiteSpace(email))
                return false;

            var pattern = "^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$";
            return Regex.IsMatch(email, pattern, RegexOptions.IgnoreCase);
        }
    }
}
