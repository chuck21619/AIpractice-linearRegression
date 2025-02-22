import h5py
import numpy as np
import pandas as pd
import openpyxl

# this loads the training features into an excel file
dataset = h5py.File('train_catvnoncat.h5')
trainX = np.array(dataset["train_set_x"][:])
trainXflatten = trainX.reshape(trainX.shape[0], -1).T
trainXStandard = trainXflatten/255

df = pd.DataFrame (trainXStandard.T)

filepath = 'testExcel.xlsx'
df.to_excel(filepath, index=False)

#this loads the training targets into an excel file
# dataset = h5py.File('train_catvnoncat.h5')
# trainY = np.array(dataset["train_set_y"][:])
# trainY = trainY.reshape((1, trainY.shape[0]))

# df = pd.DataFrame (trainY.T)

# filepath = 'testExcel2.xlsx'
# df.to_excel(filepath, index=False)