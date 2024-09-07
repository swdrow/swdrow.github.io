import pandas as pd
import numpy as np
from jinja2 import Environment, FileSystemLoader, PackageLoader
from pathlib import Path
from gsheets import Sheets
import bs4 as BeautifulSoup

th_props = [
    ('font-size', 'auto'),
    ('text-align', 'center'),
    ('font-weight', 'bold'),
    ('width', '20%')
]

# Set CSS properties for td elements in dataframe
td_props = [
    ('font-size', 'auto'),
    ('background-color', 'navy')

]

# Set table styles
styles = [
    dict(selector="th", props=th_props),
    dict(selector="td", props=td_props)
]
# region Frame Gen
sheets = Sheets.from_files('~/client_secrets.json', '~/storage.json')
records = sheets.get(
    "https://docs.google.com/spreadsheets/d/1CTD3V6jFwgLIAF7C3QvdUC_i242yeLdeMYWaPg_hiaY/edit?gid=0#gid=0")
records_t100 = records.find('As of 2024 Top 100').to_frame()
records_t100 = records_t100.drop(columns=['Unnamed: 0'])


def convert_time_format(time):
    try:
        minutes = int(float(time) // 100)
        seconds = float(time) % 100
        return f"{minutes}:{seconds:04.1f}"
    except:
        return time



records_t100[['Time', 'Split']] = records_t100[[
    'Time', 'Split']].map(convert_time_format)
# endregion
print(records_t100)
records_t100.insert(0, 'Rank', list(range(1,len(records_t100.index)+1)))
framestr = records_t100.style.set_table_styles(styles).hide(axis="index").to_html()
template_file = "Data/Templates/Test.jinja"
env = Environment(loader=PackageLoader("Data", 'templates'))
template = env.get_template("Test.jinja")
context = {
    "table": framestr
}
with open("index.html", mode="w") as f:
    f.write(template.render(context))

