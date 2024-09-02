import pandas as pd
import numpy as np
from jinja2 import Environment, FileSystemLoader, PackageLoader
from pathlib import Path

data_array = np.random.rand(4, 2)
print(data_array)
frame = pd.DataFrame(
    {'Column 1': data_array[:, 0], 'Column 2': data_array[:, 1]})
print(frame)
framestr = frame.to_html()
template_file = "Data/Templates/Test.jinja"
env = Environment(loader=PackageLoader("Data", 'templates'))
template = env.get_template("Test.jinja")
context = {
    "table": framestr
}
with open("index.html", mode="w") as f:
    f.write(template.render(context))

