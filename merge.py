import pandas as pd


df = pd.read_csv('contributors.csv', names = ['student_github_id', 'score'])
df_master = pd.read_csv('master.csv')

df_merge  = df.merge(df_master, how='right', on = 'student_github_id')
# print(df_merge.columns)
df_merge = df_merge.drop(['Phone Number', 'Timestamp'], axis= 1)
df_merge = df_merge.sort_values('score', ascending=False)
df_merge.to_csv('results.csv')