using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Core.Entities;

public class Meal : Record
{
    public long UserId { get; set; }
    public virtual AppUser? User { get; set; }
    public virtual ICollection<Product>? Products { get; set; }
}
