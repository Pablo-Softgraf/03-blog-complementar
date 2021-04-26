
import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import React from 'react';
import Header from '../../components/Header';
import Comments from '../../components/Comments';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { RichText } from 'prismic-dom';
import Prismic from '@prismicio/client';
import { getPrismicClient } from '../../services/prismic';
import { FiUser, FiCalendar, FiClock } from 'react-icons/fi'
import Link from 'next/link';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { FILE } from 'node:dns';
import { useRouter } from 'next/router';
import PostPN from '../../components/PostPN';

interface Post {
  uid: string | null;
  subtitle: string;
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
  prevPost: Post[];
  nextPost: Post[];
}

export default function Post({ prevPost, nextPost, post }: PostProps) {

  const total =
    post.data.content.reduce((sumTotal, content) => {
      const sumWordsHeading = String(content.heading).split(/[\s]+/);
      const sumWordsBody = RichText.asText(content.body).split(/[\s]+/);
      sumTotal += sumWordsHeading.length + sumWordsBody.length;
      return sumTotal;
    }, 0);

  const router = useRouter();

  return (
    <>
      <Head>
        <title>sgnews.posts</title>
      </Head>
      <Header />
      <main className={`${commonStyles.container}`}>
        {router.isFallback ?
          (<h1>Carregando...</h1>)
          :
          (
            <>
              <div>
                <img src={post.data.banner.url} alt="banner" className={styles.banner} />
              </div>

              <div className={`${commonStyles.content} ${styles.content}`}>
                <h1>{post.data.title}</h1>

                <div className={commonStyles.postInfo}>
                  <time><FiCalendar />{
                    format(
                      new Date(post.first_publication_date),
                      'dd MMM yyyy', { locale: ptBR }
                    )}</time>
                  <span><FiUser />{post.data.author}</span>
                  <time><FiClock />{Math.ceil(total / 200)} min</time>
                </div>
                {
                  post.data.content.map(item => (
                    <div key={item.heading} className={styles.post}>
                      <h2>{item.heading}</h2>

                      {item.body.map(paragraph => (
                        <p key={Math.random()}>{paragraph.text}</p>
                      ))}
                    </div>
                  ))
                }
                <div className={styles.postPrevPost}>
                  <span>
                    {prevPost.map(ppost => (
                      <Link href={`/post/${ppost.uid}`} key={ppost.uid}>
                        <a>
                          {ppost.data.title}
                          <p>
                            Post anterior
                          </p>
                        </a>
                      </Link>
                    ))
                    }
                  </span>
                  <span>
                    {nextPost.map(npost => (
                      <Link href={`/post/${npost.uid}`} key={npost.uid}>
                        <a>
                          {npost.data.title}
                          <p>
                            Próximo post
                          </p>
                        </a>
                      </Link>
                    ))
                    }

                  </span>
                </div>
              </div>
            </>
          )}
        <Comments />
      </main>
    </>
  )
}


export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();

  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    {
      pageSize: 2,
    }
  );

  // Get the paths we want to pre-render based on posts
  const paths = posts.results.map(post => ({
    params: { slug: post.uid },
  }));
  return { paths, fallback: true };
};

export const getStaticProps: GetStaticProps = async context => {
  const { slug } = context.params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('post', String(slug), {
    fetch: ['post.subtitle', 'post.title', 'post.banner', 'post.author', 'post.content'],
  });

  const prev = await prismic.query([
    Prismic.predicates.at('document.type', 'post')
  ], {
    fetch: ['post.subtitle', 'post.title', 'post.banner', 'post.author', 'post.content'],
    orderings: '[my.post.data_post desc]',
    after: response.id,
    pageSize: 1,
  })
  const prevPost = prev.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    }
  })

  const nPost = await prismic.query([
    Prismic.predicates.at('document.type', 'post')
  ], {
    fetch: ['post.subtitle', 'post.title', 'post.banner', 'post.author', 'post.content'],
    orderings: '[my.post.data_post]',
    after: response.id,
    pageSize: 1,
  })

  const nextPost = nPost.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    }
  })

  const post =
  {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content,
    }
  }


  return {
    props: { prevPost, nextPost, post }
  }


};
