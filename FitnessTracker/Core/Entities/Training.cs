using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Core.Entities;

public class Training : Record
{
    public string Description { get; set; }
    public long UserId { get; set; }
    public virtual AppUser? User { get; set; }   
    public virtual ICollection<Exercise>? Exercises { get; set; }
}
