# -*- coding: utf-8 -*-
"""
Created on Wed May 18 16:55:40 2022
@author: Octavio
"""

import numpy as np 
import requests
import json 
import pandas as pd
from datetime import timedelta, date, datetime
import warnings
import matplotlib.pyplot as plt
warnings.filterwarnings("ignore")


###################
#0 Get Historical Spread 
###################



def daterange(start_date, end_date):
    for n in range(int ((end_date - start_date).days)):
        yield start_date + timedelta(n)

poolID = '0xb53c1a33016b2dc2ff3653530bff1848a515c8c5'
start_date = date(2021, 1, 1)
end_date = date(2022, 4, 5)



#Get historical liquidity and borrowing rates for one underlying token on a Aave pool
def get_histo_rates(token_name, start_date, end_date):
    
    
    token = pd.DataFrame()
    start_date = datetime.strptime(start_date, "%Y-%m-%d")
    end_date = datetime.strptime(end_date, "%Y-%m-%d")
    
    
    #Scrap historical pools data from Aave API
    
    for single_date in daterange(start_date, end_date):
        date = single_date.strftime("%Y-%m-%d")
        url = "https://aave-api-v2.aave.com/data/liquidity/v2?poolId=" + poolID + "&date=" + date
        htmlContent = requests.get(url, verify=False)
        jsonD = json.dumps(htmlContent.text)
        jsonL = json.loads(jsonD)
        tmptoken = pd.read_json(jsonL)
        tmptoken = tmptoken[tmptoken.symbol == token_name]
        token = token.append(tmptoken)
        
        
    date_fi = pd.date_range(start=start_date + timedelta(days=1),end=end_date)
    token["date"] = date_fi
        
    return token


spread_df = get_histo_rates(token_name = "DAI", start_date = "2021-12-01", end_date = "2022-04-04")

plt.plot(spread_df.date, spread_df.avg1DaysLiquidityRate, 'g') 
plt.show()

#filter on most advanced date
#spread_df = spread_df.loc[(spread_df['date'] >= '2021-12-01')]

###################
#1 Interest Rate Model
###################


#########
#A Calibration 
#########

def VasicekCalibration(rates, dt=1/365):
    n = len(rates)
    
    # Implement MLE to calibrate parameters     
    Sx = sum(rates[0:(n-1)])
    Sy = sum(rates[1:n])
    Sxx = np.dot(rates[0:(n-1)], rates[0:(n-1)])
    Sxy = np.dot(rates[0:(n-1)], rates[1:n])
    Syy = np.dot(rates[1:n], rates[1:n])
    
    theta = (Sy * Sxx - Sx * Sxy) / (n * (Sxx - Sxy) - (Sx**2 - Sx*Sy))
    kappa = -np.log((Sxy - theta * Sx - theta * Sy + n * theta**2) / (Sxx - 2*theta*Sx + n*theta**2)) / dt
    a = np.exp(-kappa * dt)
    sigmah2 = (Syy - 2*a*Sxy + a**2 * Sxx - 2*theta*(1-a)*(Sy - a*Sx) + n*theta**2 * (1-a)**2) / n
    sigma = np.sqrt(sigmah2*2*kappa / (1-a**2))
    r0 = rates.values[n-1]
    
    return kappa, theta, sigma, r0
 

kappa, theta, sigma, r0 = VasicekCalibration(spread_df['avg1DaysLiquidityRate'])



########
#B Simulation 
########



def VasicekNextRate(r, kappa, theta, sigma, dt=1/365):
    val1 = np.exp(-1*kappa*dt)

    val2 = (sigma**2)*(1-val1**2) / (2*kappa)

    out = r*val1 + theta*(1-val1) + (np.sqrt(val2))*np.random.normal()

    return out

def VasicekSim(N, r0, kappa, theta, sigma, dt = 1/365):
    short_r = [0]*N # Create array to store rates     short_r[0] = r0 # Initialise rates at $r_0$     
    
    for i in range(1,N):
        short_r[i] = VasicekNextRate(short_r[i-1], kappa, theta, sigma, dt)
    
    return short_r

def VasicekMultiSim(M, N, r0, kappa, theta, sigma, dt = 1/365):
    sim_arr = np.ndarray((N, M))
    
    for i in range(0,M):
        sim_arr[:, i] = VasicekSim(N, r0, kappa, theta, sigma, dt)
    return sim_arr
 



# Fixed parameters
years = 1
N = years * 365
t = np.arange(0,N)/365
M = 1000
 

# 1000 years simulation 
rates_arr = VasicekMultiSim(M, N, r0, kappa, theta, sigma)
 


# Plot of the simulated paths

plt.plot(t,rates_arr)
plt.hlines(y=theta, xmin = -100, xmax=100, zorder=10, linestyles = 'dashed', label='Theta')
plt.annotate('Theta', xy=(1.0, theta+0.0005))
plt.xlim(0.1, 1.01)
plt.ylabel("Rate")
plt.xlabel("Time (yr)")
plt.show()


#######
#C Output
#######

#replace negative interest value with 0
rates_arr[rates_arr<0] = 0

#compute the mean of each simulation
avgs = [sum(vals)/len(rates_arr) for vals in zip(*rates_arr)]

#Plot of the simulated density of yield
n, bins, patches = plt.hist(avgs)
plt.show()


#Based on simulations (avgs), and fixed rate + leverage, the function computes the simulated yield for the junior layer

def LevelOfRisk (avgs, fixed_rate, leverage_factor):
    
    qt90 = np.quantile(avgs, 0.1, axis = None)
    qt95 = np.quantile(avgs, 0.05, axis = None)
    qt99 = np.quantile(avgs, 0.01, axis = None)
    
    rate_qt90 = (qt90-fixed_rate)*leverage_factor
    rate_qt95 = (qt95-fixed_rate)*leverage_factor
    rate_qt99 = (qt99-fixed_rate)*leverage_factor
    
    return rate_qt90, rate_qt95, rate_qt99



# Deviation of historical yield by historical sigma

'''
mean = spread_df["LR_EMA30"] = spread_df["avg1DaysLiquidityRate"].ewm(span=30, adjust=False).mean()
mean = mean.values[len(mean) - 1]
sigma = spread_df['LR_STD30'] = spread_df['avg1DaysLiquidityRate'].ewm(span=30, adjust=False).std()
sigma = sigma.values[len(sigma) - 1]
LevelOfRisk(avgs, mean - 3*sigma, 10)
'''