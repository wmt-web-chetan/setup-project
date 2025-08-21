import { Spin } from 'antd'
import React from 'react'

const Loading = ({className="h-full"}) => {
  return (
    <div className={`${className} flex items-center justify-center w-full`}>
      <Spin size='large'></Spin>
    </div>
  )
}

export default Loading
