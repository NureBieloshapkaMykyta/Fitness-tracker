using Microsoft.AspNetCore.Identity;

namespace Core.Entities;

public class AppUser : IdentityUser<long>
{
    public virtual ICollection<Training>? Trainings { get; set; }
    public virtual ICollection<Meal>? Meals { get; set; }
}
