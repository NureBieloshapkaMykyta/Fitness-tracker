using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Core.Entities;

public abstract class Record
{
    public long Id { get; set; }
    public DateTime Date { get; set; }
}
