﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations;

namespace Core.Entities;

public class Exercise
{
    public long Id { get; set; }
    public string Name { get; set; }
    public string Description { get; set; }
    public TimeSpan Duration { get; set; } 
    public long TrainingId { get; set; }
    public virtual Training? Training { get; set; }
    public int? CaloriesBurned { get; set; }
}
