// https://docs.aws.amazon.com/lambda/latest/dg/lambda-nodejs.html
// https://docs.aws.amazon.com/lambda/latest/dg/nodejs-handler.html
// https://github.com/kamaslau/auther

const catchError = (error) => {
  throw new Error(error);
};

/**
 * 获取access_token
 *
 * 凭证为客户端请求GitHubAPI获取的code，以及在GitHub注册的client_id、client_secret
 */
const requestAccessToken = async (credentials) => {
  // console.log('requestAccessToken: ', credentials)

  const result = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(credentials),
  })
    .then((res) => res.json())
    .catch(catchError);

  // console.log('result: ', result)
  return result;
};

/**
 * 获取用户数据；凭证为access_token
 */
const requestUserAccount = async (token) => {
  // console.log('requestUserAccount: ', token)

  const result = await fetch(
    `https://api.github.com/user?access_token=${token}`,
    {
      headers: { Authorization: `bearer ${token}` },
    }
  )
    .then((res) => res.json())
    .catch(catchError);

  if (typeof result.message === "string") {
    throw new Error(result.message);
  }

  // console.log('result: ', result)
  return result;
};

// https://docs.aws.amazon.com/lambda/latest/dg/services-apigateway.html
export const handler = async (event) => {
  if (event.requestContext.http.method !== "POST") {
    return { statusCode: 405 };
  }

  const { appId, appSecret, code } = JSON.parse(event.body);

  const credentials = {
    client_id: appId,
    client_secret: appSecret,
    code,
  };

  try {
    const { access_token } = await requestAccessToken(credentials);
    const user = await requestUserAccount(access_token);
    return {
      statusCode: 200,
      body: JSON.stringify({
        content: user,
      }),
    };
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: error.message,
        event,
      }),
    };
  }
};
